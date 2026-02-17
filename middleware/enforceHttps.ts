import { Request, Response, NextFunction } from 'express';

/**
 * HTTPS Enforcement Middleware
 * - Redirects HTTP requests to HTTPS (permanent 301 redirect)
 * - Adds HSTS header for browsers to remember HTTPS preference
 * - Respects X-Forwarded-Proto header from reverse proxies
 * - Skips enforcement in development (localhost, 127.0.0.1)
 * - Must be used after app.set('trust proxy', 1)
 */
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  // Only enforce in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already secure
  // req.secure works for direct HTTPS connections
  // X-Forwarded-Proto is set by reverse proxies (Nginx, Cloudflare, etc.)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (isSecure) {
    // Add HSTS header: tell browsers to always use HTTPS for this domain
    // max-age: 31536000 seconds = 1 year
    // includeSubDomains: apply to all subdomains
    // preload: allow inclusion in browser HSTS preload lists
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    return next();
  }

  // Allow localhost and 127.0.0.1 for local development
  const host = req.headers.host || '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')) {
    return next();
  }

  // Redirect HTTP to HTTPS using permanent redirect (301)
  // Preserves request method and URL structure
  const redirectUrl = `https://${host}${req.originalUrl}`;
  return res.redirect(301, redirectUrl);
}

/**
 * Secure cookie options for production
 * Use with res.cookie() calls throughout the application
 */
export const secureCookieOptions = {
  httpOnly: true,        // Prevent XSS attacks - not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  sameSite: 'strict' as const, // Prevent CSRF attacks - don't send cookies cross-site
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};
