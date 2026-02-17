import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston Logger Configuration
 * 
 * Features:
 * - Separate info and error log files
 * - Console output with colors for development
 * - Timestamp on all logs
 * - No sensitive data (passwords, tokens) logged
 * - Different log levels for different transports
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define simple format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'vairo-api' },
  transports: [
    // Info logs: general application logs
    new winston.transports.File({
      filename: path.join(logsDir, 'info.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Error logs: all error and above
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs: everything
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

/**
 * Sanitize sensitive data from objects
 * Removes: password, passwords, token, tokens, secret, secrets, etc.
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'passwords',
    'token',
    'tokens',
    'secret',
    'secrets',
    'authorization',
    'auth',
    'refresh_token',
    'refreshToken',
    'access_token',
    'accessToken',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'creditCard',
    'ssn',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Authentication logging functions
 */
const authLogger = {
  /**
   * Log successful login
   */
  loginSuccess: (userId: string, email: string, ipAddress?: string) => {
    logger.info('User login successful', {
      userId,
      email,
      ipAddress,
      action: 'LOGIN_SUCCESS',
    });
  },

  /**
   * Log failed login attempt
   */
  loginFailed: (email: string, reason: string, ipAddress?: string, attemptCount?: number) => {
    logger.warn('Login attempt failed', {
      email,
      reason,
      ipAddress,
      attemptCount,
      action: 'LOGIN_FAILED',
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log authentication errors
   */
  authError: (error: any, context: string, userId?: string) => {
    logger.error('Authentication error', {
      error: error.message || String(error),
      stack: error.stack,
      context,
      userId,
      action: 'AUTH_ERROR',
    });
  },

  /**
   * Log registration
   */
  registerSuccess: (userId: string, email: string, ipAddress?: string) => {
    logger.info('User registered', {
      userId,
      email,
      ipAddress,
      action: 'REGISTER_SUCCESS',
    });
  },

  /**
   * Log registration failure
   */
  registerFailed: (email: string, reason: string, ipAddress?: string) => {
    logger.warn('Registration failed', {
      email,
      reason,
      ipAddress,
      action: 'REGISTER_FAILED',
    });
  },

  /**
   * Log password reset request
   */
  passwordResetRequested: (email: string, ipAddress?: string) => {
    logger.info('Password reset requested', {
      email,
      ipAddress,
      action: 'PASSWORD_RESET_REQUESTED',
    });
  },

  /**
   * Log password reset completion
   */
  passwordResetSuccess: (userId: string, email: string) => {
    logger.info('Password reset completed', {
      userId,
      email,
      action: 'PASSWORD_RESET_SUCCESS',
    });
  },

  /**
   * Log token verification
   */
  tokenVerified: (userId: string, tokenType: string) => {
    logger.info('Token verified', {
      userId,
      tokenType,
      action: 'TOKEN_VERIFIED',
    });
  },

  /**
   * Log invalid token
   */
  tokenInvalid: (reason: string, tokenType?: string) => {
    logger.warn('Invalid token', {
      reason,
      tokenType,
      action: 'TOKEN_INVALID',
    });
  },
};

/**
 * RBAC and role logging functions
 */
const rbacLogger = {
  /**
   * Log role assignment
   */
  roleAssigned: (userId: string, role: string, assignedBy: string) => {
    logger.info('Role assigned', {
      userId,
      role,
      assignedBy,
      action: 'ROLE_ASSIGNED',
    });
  },

  /**
   * Log role change
   */
  roleChanged: (userId: string, oldRole: string, newRole: string, changedBy: string) => {
    logger.info('Role changed', {
      userId,
      oldRole,
      newRole,
      changedBy,
      action: 'ROLE_CHANGED',
    });
  },

  /**
   * Log role removal
   */
  roleRemoved: (userId: string, role: string, removedBy: string) => {
    logger.info('Role removed', {
      userId,
      role,
      removedBy,
      action: 'ROLE_REMOVED',
    });
  },

  /**
   * Log unauthorized access attempt
   */
  unauthorizedAccess: (userId: string | undefined, requiredRole: string, ipAddress?: string) => {
    logger.warn('Unauthorized access attempt', {
      userId: userId || 'ANONYMOUS',
      requiredRole,
      ipAddress,
      action: 'UNAUTHORIZED_ACCESS',
    });
  },

  /**
   * Log permission denied
   */
  permissionDenied: (userId: string, action: string, resource: string) => {
    logger.warn('Permission denied', {
      userId,
      action,
      resource,
      eventType: 'PERMISSION_DENIED',
    });
  },
};

/**
 * General logging functions
 */
const generalLogger = {
  info: (message: string, meta?: any) => {
    logger.info(message, sanitizeData(meta));
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, sanitizeData(meta));
  },

  error: (message: string, error?: any, meta?: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error(message, {
      error: errorMessage,
      stack: errorStack,
      ...sanitizeData(meta),
    });
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, sanitizeData(meta));
  },
};

// Combine all loggers
const combinedLogger = {
  auth: authLogger,
  rbac: rbacLogger,
  ...generalLogger,
};

export default combinedLogger;
export { sanitizeData };
