import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import logger from '../utils/logger';

/**
 * Extend Express Request to include csrfToken method
 */
declare global {
  namespace Express {
    interface Request {
      csrfToken(): string;
    }
  }
}

/**
 * CSRF Protection Middleware
 * 
 * Protects against Cross-Site Request Forgery attacks
 * - Generates CSRF tokens using doublecookie method
 * - Validates tokens on state-changing requests (POST, PUT, DELETE, PATCH)
 * - Tokens transmitted via cookies + X-CSRF-Token header or form field
 * 
 * Flow:
 * 1. Client requests CSRF token from /api/csrf-token
 * 2. Server sets CSRF cookie and returns token in response
 * 3. Client sends token in X-CSRF-Token header on state-changing requests
 * 4. Middleware validates token before allowing request
 */

// CSRF middleware using double-cookie pattern (most secure for stateless APIs)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true, // Only accessible via HTTP, not JavaScript
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: 'strict', // Prevent cross-site cookie sending
    maxAge: 3600000, // 1 hour
  },
});

/**
 * Middleware to initialize cookie parser (required for CSRF)
 * Must be called after express.json() and before CSRF protection
 */
export function initializeCookieParser(): (req: Request, res: Response, next: NextFunction) => void {
  // Use an empty string or strong secret in production
  const cookieSecret = process.env.COOKIE_SECRET || 'development-secret';
  return cookieParser(cookieSecret);
}

/**
 * Middleware to generate and return CSRF token
 * GET /api/csrf-token
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { "csrfToken": "..." }
 * }
 */
export function getCsrfToken(req: Request, res: Response) {
  try {
    const token = req.csrfToken();

    logger.debug('CSRF token generated', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      data: {
        csrfToken: token,
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate CSRF token', error, {
      ipAddress: req.ip,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_GENERATION_FAILED',
        message: 'Failed to generate CSRF token',
      },
    });
  }
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Expects token in one of these locations:
 * 1. X-CSRF-Token header
 * 2. X-XSRF-TOKEN header
 * 3. csrf-token form field
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Only validate on state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip validation for certain endpoints (like health checks)
  if (req.path === '/health' || req.path === '/healthz') {
    return next();
  }

  try {
    csrfProtection(req, res, (err: any) => {
      if (err) {
        // CSRF token validation failed
        logger.warn('CSRF token validation failed', {
          method: req.method,
          path: req.path,
          ipAddress: req.ip,
          error: err.message,
          action: 'CSRF_VALIDATION_FAILED',
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: 'CSRF token validation failed. Please refresh and try again.',
          },
        });
      }

      logger.debug('CSRF token validated', {
        method: req.method,
        path: req.path,
      });

      next();
    });
  } catch (error: any) {
    logger.error('CSRF validation error', error, {
      method: req.method,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_ERROR',
        message: 'An error occurred during CSRF validation',
      },
    });
  }
}

/**
 * Middleware to attach CSRF token to all responses (optional, for convenience)
 * Useful for single-page applications that need token on every response
 */
export function attachCsrfTokenToResponse(req: Request, res: Response, next: NextFunction) {
  // Only for safe methods (GET, HEAD, OPTIONS)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Generate token for safe requests
  try {
    const token = req.csrfToken();
    
    // Attach to response headers
    res.setHeader('X-CSRF-Token', token);
    
    // Also available in response body if needed
    (req as any).csrfToken = token;
  } catch (error) {
    // Don't fail the request if token generation fails
    logger.warn('Failed to attach CSRF token to response', error);
  }

  next();
}

/**
 * Error handler for CSRF errors
 * Can be used to provide more helpful error messages
 */
export function csrfErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF middleware error', {
      method: req.method,
      path: req.path,
      ipAddress: req.ip,
      errorCode: err.code,
      action: 'CSRF_ERROR',
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      },
    });
  }

  // Pass other errors to default error handler
  next(err);
}

/**
 * Wrapper for applying CSRF protection to specific routes
 * Usage: app.post('/api/posts', protectRoute, handler)
 */
export function protectRoute(req: Request, res: Response, next: NextFunction) {
  validateCsrfToken(req, res, next);
}

/**
 * Middleware to conditionally apply CSRF protection
 * Useful for routes that should only require CSRF if from web (not API)
 * Checks if request is from browser (has referer or user-agent indicates browser)
 */
export function conditionalCsrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for non-state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip if Authorization header is present (API client)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // This is an API request with JWT, skip CSRF
    return next();
  }

  // Otherwise, require CSRF token
  validateCsrfToken(req, res, next);
}

export { csrfProtection };
