/**
 * RATE LIMITING MIDDLEWARE
 * 
 * Comprehensive rate limiting for Vairo API
 * Uses express-rate-limit with Redis store
 * 
 * Installation:
 * npm install express-rate-limit rate-limit-redis redis
 * npm install --save-dev @types/express-rate-limit
 */

// @ts-ignore - express-rate-limit may not be installed yet
import rateLimit from 'express-rate-limit';
// @ts-ignore
import type { RateLimitRequestHandler } from 'express-rate-limit';
// @ts-ignore - express installed in backend only
import type { Request, Response } from 'express';
import crypto from 'crypto';

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Store Configuration
 * 
 * In production, use Redis for distributed rate limiting.
 * In development, use memory store (default).
 * 
 * Redis Setup (Production):
 * import { RedisStore } from 'rate-limit-redis';
 * import { createClient } from 'redis';
 * 
 * const redisClient = createClient({
 *   host: process.env.REDIS_HOST || 'localhost',
 *   port: parseInt(process.env.REDIS_PORT || '6379'),
 *   password: process.env.REDIS_PASSWORD,
 *   db: 0 // Use separate DB for rate limits
 * });
 * 
 * redisClient.on('error', (err) => {
 *   console.error('Redis error:', err);
 *   // Fall back to memory store
 * });
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Get store based on environment.
 * In production, if Redis is available, use it.
 * Otherwise, fall back to memory store.
 */
function getStore() {
  if (IS_PRODUCTION && process.env.REDIS_URL) {
    try {
      const { RedisStore } = require('rate-limit-redis');
      const redis = require('redis');

      const redisClient = redis.createClient({
        url: process.env.REDIS_URL,
      });

      redisClient.on('error', (err: Error) => {
        console.error('Redis error, falling back to memory store:', err.message);
      });

      return new RedisStore({
        client: redisClient,
        prefix: process.env.RATE_LIMIT_PREFIX || 'rl:',
      });
    } catch (error) {
      console.warn('Redis not available for rate limiting, using memory store');
    }
  }

  // Default: memory store (built-in)
  return undefined;
}

// ============================================================
// RESPONSE HANDLERS
// ============================================================

/**
 * Send JSON error response when rate limit exceeded.
 */
function handleRateLimitExceeded(req: Request, res: Response, endpoint: string) {
  const retryAfter = res.getHeader('Retry-After') || '60';

  res.status(429).json({
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: `Too many requests to ${endpoint}. Please try again later.`,
    retryAfter: parseInt(retryAfter.toString()),
    limit: res.getHeader('RateLimit-Limit'),
    remaining: res.getHeader('RateLimit-Remaining'),
    reset: res.getHeader('RateLimit-Reset'),
  });
}

/**
 * IP address extractor - handles proxies
 */
function getClientIp(req: Request): string {
  // Check trusted proxy headers first
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }

  const cloudflareIp = req.headers['cf-connecting-ip'];
  if (cloudflareIp) {
    return typeof cloudflareIp === 'string' ? cloudflareIp : cloudflareIp[0];
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Check if request should skip rate limiting
 */
function shouldSkip(req: Request): boolean {
  const ip = getClientIp(req);

  // Skip internal/localhost
  if (['127.0.0.1', '::1', 'localhost'].includes(ip)) {
    return true;
  }

  // Skip health check endpoints
  if (req.path === '/health' || req.path === '/healthz') {
    return true;
  }

  // Skip admin internal endpoints
  const internalPaths = ['/admin/health', '/admin/metrics', '/admin/status'];
  if (internalPaths.some(p => req.path.startsWith(p))) {
    return true;
  }

  // Check env var whitelist
  const whitelistedIps = (process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(Boolean);
  if (whitelistedIps.includes(ip)) {
    return true;
  }

  return false;
}

/**
 * Log rate limit events for monitoring
 */
function logRateLimitHit(req: Request, endpoint: string, limit: number, window: string) {
  const ip = getClientIp(req);
  const userId = (req as any).user?.id || 'anonymous';

  // Log to console in development
  if (!IS_PRODUCTION) {
    console.warn(`⚠️ Rate limit hit: ${endpoint} from ${ip} (user: ${userId})`);
  }

  // Log structured log for monitoring
  console.log(JSON.stringify({
    type: 'rate_limit_hit',
    timestamp: new Date().toISOString(),
    endpoint,
    ip,
    userId,
    limit,
    window,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
  }));
}

// ============================================================
// RATE LIMITERS
// ============================================================

/**
 * AUTHENTICATION TIER LIMITS
 */

/**
 * Login Rate Limiter
 * 
 * Limit: 5 attempts per minute per IP
 * Purpose: Prevent brute force password guessing
 * 
 * If user tries 5 wrong passwords quickly,
 * they must wait 60 seconds before trying again.
 */
export const loginLimiter = rateLimit({
  store: getStore(),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests
  message: 'Too many login attempts',
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    // More specific key: IP + user agent hash
    return `login:${ip}:${crypto.createHash('md5').update(userAgent).digest('hex')}`;
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/auth/login', 5, '1 minute');
    handleRateLimitExceeded(req, res, '/api/auth/login');
  },
});

/**
 * Register Rate Limiter
 * 
 * Limit: 3 accounts per hour per IP
 * Purpose: Prevent account enumeration and bulk registration
 * 
 * Blocks someone trying to create 100 accounts in an hour.
 * Legitimate users: ~1 per day, no problem.
 * Bot behavior: 3+ per hour, blocked.
 */
export const registerLimiter = rateLimit({
  store: getStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts
  message: 'Too many account creation attempts from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    const ip = getClientIp(req);
    return `register:${ip}`;
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/auth/register', 3, '1 hour');
    handleRateLimitExceeded(req, res, '/api/auth/register');
  },
});

/**
 * Password Reset Rate Limiter
 * 
 * Limit: 5 requests per hour per email
 * Purpose: Prevent account takeover via password reset spam
 * 
 * If attacker requests password reset 5+ times,
 * they must wait an hour before trying again.
 */
export const passwordResetLimiter = rateLimit({
  store: getStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests
  message: 'Too many password reset attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    // Get email from request body
    const email = (req.body?.email || '').toLowerCase();
    if (!email) {
      return getClientIp(req); // Fallback to IP
    }

    // Hash email to not expose in logs
    const emailHash = crypto.createHash('sha256').update(email).digest('hex');
    return `reset:${emailHash}`;
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/auth/password-reset', 5, '1 hour');
    handleRateLimitExceeded(req, res, '/api/auth/password-reset');
  },
});

/**
 * Verify Token Rate Limiter
 * 
 * Limit: 10 requests per minute per IP
 * Purpose: Prevent token enumeration attacks
 */
export const verifyTokenLimiter = rateLimit({
  store: getStore(),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many token verification attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => getClientIp(req),
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/auth/verify', 10, '1 minute');
    handleRateLimitExceeded(req, res, '/api/auth/verify');
  },
});

// ============================================================
// USER CONTENT TIER LIMITS
// ============================================================

/**
 * Create Post Rate Limiter
 * 
 * Limit: 20 posts per minute per authenticated user
 * Purpose: Prevent content spam
 * 
 * Legitimate users: Post 1-5 per day, no problem.
 * Content creators: Post 5-10 per day max, no problem.
 * Bot/spam: Would hit 20 quickly within minute, blocked.
 */
export const createPostLimiter = rateLimit({
  store: getStore(),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many post creation attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    const userId = (req as any).user?.id;
    if (userId) {
      return `post:${userId}`; // Per user
    }
    return getClientIp(req); // Fallback to IP
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/posts (create)', 20, '1 minute');
    handleRateLimitExceeded(req, res, '/api/posts (create)');
  },
});

/**
 * Create Comment Rate Limiter
 * 
 * Limit: 50 comments per minute per authenticated user
 * Purpose: Allow rapid conversation while blocking spam
 * 
 * Conversation: Users might comment 10-20 quickly in discussion.
 * Spam: Bot commenting 100+ per minute, blocked.
 */
export const createCommentLimiter = rateLimit({
  store: getStore(),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: 'Too many comment attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    const userId = (req as any).user?.id;
    if (userId) {
      return `comment:${userId}`;
    }
    return getClientIp(req);
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/comments (create)', 50, '1 minute');
    handleRateLimitExceeded(req, res, '/api/comments (create)');
  },
});

/**
 * Like/Unlike Rate Limiter
 * 
 * Limit: 100 likes per minute per authenticated user
 * Purpose: Allow rapid clicking while blocking bot spam
 * 
 * Rapid clicking: User can like 50 posts in minute, no problem.
 * Spam click: Bot clicking 1000/sec, blocked.
 */
export const likeLimiter = rateLimit({
  store: getStore(),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many like attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    const userId = (req as any).user?.id;
    if (userId) {
      return `like:${userId}`;
    }
    return getClientIp(req);
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/posts/:id/like', 100, '1 minute');
    handleRateLimitExceeded(req, res, '/api/posts/:id/like');
  },
});

/**
 * Update Profile Rate Limiter
 * 
 * Limit: 20 updates per hour per user
 * Purpose: Prevent spam profile updates
 * 
 * Legitimate: User edits profile 1-2 times per day, no problem.
 * Spam: Bot updating profile 100+ times, blocked.
 */
export const updateProfileLimiter = rateLimit({
  store: getStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many profile update attempts',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => {
    const userId = (req as any).user?.id;
    if (userId) {
      return `profile:${userId}`;
    }
    return getClientIp(req);
  },
  handler: (req: any, res: any) => {
    logRateLimitHit(req, '/api/users/me', 20, '1 hour');
    handleRateLimitExceeded(req, res, '/api/users/me');
  },
});

// ============================================================
// GENERAL API TIER LIMITS (Fallback)
// ============================================================

/**
 * Global API Rate Limiter
 * 
 * Limit: 1000 requests per hour per IP
 * Purpose: Catch-all for any endpoint
 * 
 * Legitimate users: ~10-50 requests per hour, no problem.
 * API scraping: 1000+, blocked.
 * 
 * Note: More specific limiters (above) will be hit first.
 * This is a catch-all for unmeasured endpoints.
 */
export const globalLimiter = rateLimit({
  store: getStore(),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  keyGenerator: (req: any) => getClientIp(req),
  handler: (req: any, res: any) => {
    logRateLimitHit(req, 'global', 1000, '1 hour');
    handleRateLimitExceeded(req, res, 'API');
  },
});

// ============================================================
// EXPORT ALL LIMITERS
// ============================================================

export const rateLimiters = {
  // Auth endpoints
  login: loginLimiter,
  register: registerLimiter,
  passwordReset: passwordResetLimiter,
  verifyToken: verifyTokenLimiter,

  // Content endpoints
  createPost: createPostLimiter,
  createComment: createCommentLimiter,
  like: likeLimiter,
  updateProfile: updateProfileLimiter,

  // Global fallback
  global: globalLimiter,
};

export default rateLimiters;
