import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Logging middleware for RBAC operations
 * Tracks role changes, permission denials, and unauthorized access attempts
 */

/**
 * Middleware to log successful authentication with user role
 */
export function logAuthenticationSuccess(req: Request, res: Response, next: NextFunction) {
  // Store original res.json to intercept the response
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Log successful authentication
    if (res.statusCode === 200 && data?.data?.user) {
      const user = data.data.user;
      logger.info('User authenticated', {
        userId: user.id,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
      });
    }

    return originalJson(data);
  };

  next();
}

/**
 * Middleware to log role change operations
 * Should be placed after role change operations
 */
export function logRoleChange(req: Request, res: Response, next: NextFunction) {
  // Store the original res.json
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Log role change if operation was successful
    if (res.statusCode === 200 && req.body?.role) {
      const userId = req.params.userId;
      const newRole = req.body.role;
      const changedBy = (req as any).user?.id || 'system';

      logger.rbac.roleChanged(userId, 'unknown', newRole, changedBy);
    }

    return originalJson(data);
  };

  next();
}

/**
 * Middleware to log unauthorized access attempts
 */
export function logUnauthorizedAccess(req: Request, res: Response, next: NextFunction) {
  // Store the original json method
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Log 401 Unauthorized and 403 Forbidden responses
    if ((res.statusCode === 401 || res.statusCode === 403) && data?.error) {
      const userId = (req as any).user?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;

      if (res.statusCode === 403) {
        logger.rbac.permissionDenied(userId || 'ANONYMOUS', req.method, req.path);
      } else if (res.statusCode === 401) {
        logger.rbac.unauthorizedAccess(userId, 'authenticated', ipAddress);
      }
    }

    return originalJson(data);
  };

  next();
}

/**
 * Simple role-based access control with logging
 * Usage: app.use('/api/admin', requireRole('admin', logRoleChangeAttempts))
 */
export function requireRole(requiredRole: string, next?: NextFunction) {
  return (req: Request, res: Response, nextFn: NextFunction) => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    if (!userRole) {
      logger.rbac.unauthorizedAccess(undefined, requiredRole, req.ip);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Check if user has required role
    if (userRole !== requiredRole) {
      logger.rbac.permissionDenied(userId, `access_${requiredRole}_route`, req.path);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This action requires ${requiredRole} role`,
        },
      });
    }

    logger.info('Role-based access granted', {
      userId,
      userRole,
      requiredRole,
      path: req.path,
    });

    nextFn();
  };
}

/**
 * Middleware to track login attempts for failed logins
 * Logs a counter of consecutive failed attempts
 */
let loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

export function trackLoginAttempts(req: Request, res: Response, next: NextFunction) {
  const email = req.body?.email;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const key = `${email}:${ipAddress}`;

  // Store original json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    if (res.statusCode !== 200) {
      // Failed login attempt
      const attempt = loginAttempts.get(key) || { count: 0, lastAttempt: Date.now() };
      attempt.count += 1;
      attempt.lastAttempt = Date.now();
      loginAttempts.set(key, attempt);

      logger.warn('Failed login attempt', {
        email,
        ipAddress,
        attemptCount: attempt.count,
      });

      // Reset after 1 hour
      setTimeout(() => {
        loginAttempts.delete(key);
      }, 60 * 60 * 1000);
    } else if (res.statusCode === 200) {
      // Successful login - clear attempts
      if (loginAttempts.has(key)) {
        loginAttempts.delete(key);
      }
    }

    return originalJson(data);
  };

  next();
}
