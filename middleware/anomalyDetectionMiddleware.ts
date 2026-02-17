import { Request, Response, NextFunction } from 'express';
import anomalyDetection from '../utils/anomalyDetection';
import logger from '../utils/logger';

/**
 * Anomaly Detection Middleware
 * 
 * Integrates anomaly detection into authentication flows:
 * - Check account lock status before login
 * - Track failed/successful login attempts
 * - Block requests from locked accounts
 * - Track user actions for rapid-fire detection
 */

/**
 * Middleware to check if account is locked
 * Should be applied before login validation
 */
export function checkAccountLock(req: Request, res: Response, next: NextFunction) {
  const email = req.body?.email;

  if (!email) {
    return next();
  }

  // Find user by email (this is simplified - in production, query database)
  // For now, we'll pass through and check after authentication
  // The actual check happens in trackLoginAttempt
  
  next();
}

/**
 * Middleware to track login attempts (success/failure)
 * Should be applied AFTER the login response is determined
 * Usage: Place in the login route handler
 * 
 * Example in login route:
 * const result = trackLoginAnomalies(userId, email, ipAddress, success);
 * if (result.isLocked) {
 *   return res.status(423).json({ ... });
 * }
 */
export function trackLoginAnomalies(
  userId: string,
  email: string,
  ipAddress: string | undefined,
  success: boolean
): { riskScore: number; isLocked: boolean; reason?: string } {
  const ip = ipAddress || 'unknown';
  const result = anomalyDetection.trackLoginAttempt(userId, email, ip, success);

  if (result.isLocked) {
    logger.warn('Login blocked - account locked', {
      userId,
      email,
      ipAddress: ip,
      riskScore: result.riskScore,
      reason: result.reason,
      action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
    });
  }

  return result;
}

/**
 * Middleware to track authenticated user actions
 * Should be applied to authenticated routes to detect rapid requests
 * 
 * Usage: 
 * app.use(authMiddleware); // First authenticate
 * app.use(trackUserActionAnomalies); // Then check for anomalies
 */
export function trackUserActionAnomalies(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  const email = (req as any).user?.email;

  if (!userId || !email) {
    return next();
  }

  const result = anomalyDetection.trackUserAction(userId, email);

  if (result.isLocked) {
    logger.warn('User action blocked - account locked', {
      userId,
      email,
      riskScore: result.riskScore,
      action: 'ACTION_BLOCKED_LOCKED_ACCOUNT',
    });

    return res.status(423).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Your account has been temporarily locked due to suspicious activity. Please try again later.',
      },
    });
  }

  // Add anomaly info to request for logging
  (req as any).anomaly = {
    riskScore: result.riskScore,
    isLocked: result.isLocked,
  };

  next();
}

/**
 * Optional: Middleware for admin endpoint to check account status
 * GET /api/admin/users/:userId/anomaly-status
 */
export function getAnomalyStatus(req: Request, res: Response) {
  const userId = req.params.userId;
  const status = anomalyDetection.getUserAnomalyStatus(userId);

  if (!status) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND' },
    });
  }

  res.status(200).json({
    success: true,
    data: status,
  });
}

/**
 * Optional: Middleware for admin endpoint to reset risk score
 * POST /api/admin/users/:userId/reset-risk
 */
export function resetUserRisk(req: Request, res: Response) {
  const userId = req.params.userId;
  const adminId = (req as any).user?.id;
  const reason = req.body?.reason || 'Admin reset';

  logger.info('Admin reset user risk score', {
    userId,
    adminId,
    reason,
    action: 'ADMIN_RESET_RISK',
  });

  anomalyDetection.resetUserRiskScore(userId, `${reason} (by ${adminId})`);

  res.status(200).json({
    success: true,
    message: `Risk score reset for user ${userId}`,
  });
}

/**
 * Optional: Middleware for admin endpoint to unlock account
 * POST /api/admin/users/:userId/unlock
 */
export function unlockUser(req: Request, res: Response) {
  const userId = req.params.userId;
  const adminId = (req as any).user?.id;
  const reason = req.body?.reason || 'Admin unlock';

  logger.info('Admin unlocked account', {
    userId,
    adminId,
    reason,
    action: 'ADMIN_UNLOCK_ACCOUNT',
  });

  anomalyDetection.unlockUserAccount(userId, `${reason} (by ${adminId})`);

  res.status(200).json({
    success: true,
    message: `Account unlocked for user ${userId}`,
  });
}

/**
 * Optional: Middleware for admin endpoint to get system metrics
 * GET /api/admin/anomaly-metrics
 */
export function getAnomalyMetrics(req: Request, res: Response) {
  const metrics = anomalyDetection.getMetrics();

  res.status(200).json({
    success: true,
    data: {
      ...metrics,
      timestamp: new Date().toISOString(),
      config: {
        riskThreshold: anomalyDetection.getConfig().RISK_THRESHOLD,
        warningThreshold: anomalyDetection.getConfig().WARNING_THRESHOLD,
        lockDuration: anomalyDetection.getConfig().LOCK_DURATION,
      },
    },
  });
}
