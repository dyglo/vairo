import { Request, Response, NextFunction } from 'express';

/**
 * HTTPS Enforcement Middleware
 * - Redirects HTTP requests to HTTPS
 * - Should be applied after trust proxy is set
 * - Skips redirect in development (localhost, 127.0.0.1)
 */
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  // Only enforce in production
  if (process.env.NODE_ENV !== 'production') return next();

  // If request is already secure, continue
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Allow localhost and 127.0.0.1 for development
  const host = req.headers.host || '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return next();
  }

  // Redirect to HTTPS
  return res.redirect(301, `https://${host}${req.originalUrl}`);
}
