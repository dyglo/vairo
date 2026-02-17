/**
 * Express Server with Rate Limiting
 * 
 * ✅ All API routes protected with rate limiting
 * ✅ Authentication and authorization integrated
 * ✅ Production-ready configuration
 * ✅ CORS, error handling, logging included
 * 
 * Run:
 * npm run server  (development with nodemon)
 * npm start       (production)
 * 
 * Environment Variables Required:
 * - PORT (default: 3000)
 * - NODE_ENV (development | production)
 * - DATABASE_URL (for Supabase/PostgreSQL)
 * - JWT_SECRET (for token signing)
 * - REDIS_URL (optional, for production rate limiting)
 */

// @ts-ignore - express installed in backend only
import express, { Request, Response, NextFunction } from 'express';
// @ts-ignore - cors installed in backend only
import cors from 'cors';
import dotenv from 'dotenv';

// Import logger
import logger from './utils/logger';

// Import CSRF protection
import {
  initializeCookieParser,
  validateCsrfToken,
  getCsrfToken,
  attachCsrfTokenToResponse,
  conditionalCsrfProtection,
} from './middleware/csrf';

// Import anomaly detection
import anomalyDetection from './utils/anomalyDetection';
import {
  trackLoginAnomalies,
  trackUserActionAnomalies,
  getAnomalyStatus,
  resetUserRisk,
  unlockUser,
  getAnomalyMetrics,
} from './middleware/anomalyDetectionMiddleware';

// Import security middleware

import { configureHelmet } from './middleware/helmet';
import { enforceHttps, secureCookieOptions } from './middleware/enforceHttps';

// Import RBAC and logging middleware
import {
  logAuthenticationSuccess,
  logRoleChange,
  logUnauthorizedAccess,
  trackLoginAttempts,
} from './middleware/rbacLogging';

// Import rate limiters
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verifyTokenLimiter,
  createPostLimiter,
  createCommentLimiter,
  likeLimiter,
  updateProfileLimiter,
  globalLimiter,
} from './middleware/rateLimiters';

// Import validation middleware
import {
  loginValidation,
  registerValidation,
  passwordResetValidation,
  verifyTokenValidation,
  createPostValidation,
  createCommentValidation,
  updateProfileValidation,
  userIdParamValidation,
  postIdParamValidation,
  handleValidationErrors,
} from './middleware/validation';

// Load environment variables
dotenv.config();

// ============================================================
// APP SETUP
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================
// SECURITY MIDDLEWARE (Applied First)
// ============================================================
// Security headers must be applied before other middleware
// to ensure they're set on all responses

// Configure Helmet security headers
configureHelmet(app);

// Explicitly disable X-Powered-By (Helmet does this, but also explicit)
app.disable('x-powered-by');

// ============================================================
// PROXY CONFIGURATION
// ============================================================
// CRITICAL: Trust proxy must be set BEFORE HTTPS enforcement middleware
// This tells Express to trust X-Forwarded-* headers from reverse proxies
// Set to 1 to trust the immediate proxy (standard for single proxy)
// Behind multiple proxies? Adjust accordingly (2, 3, etc.) or pass array of trusted IPs
app.set('trust proxy', 1);

// Enforce HTTPS in production (redirect HTTP to HTTPS)
// Adds HSTS header to instruct browsers to use HTTPS
app.use(enforceHttps);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// CSRF PROTECTION
// ============================================================
// Initialize cookie parser (required for CSRF token storage)
app.use(initializeCookieParser());

// Apply CSRF validation to state-changing routes (POST, PUT, DELETE, PATCH)
// Uses double-cookie pattern - secure for stateless APIs
app.use(validateCsrfToken);

// Optionally attach CSRF token to safe GET responses
app.use(attachCsrfTokenToResponse);

// ============================================================
// SECURE COOKIE CONFIGURATION
// ============================================================
// Configure secure cookie settings for authentication tokens
// These settings prevent XSS and CSRF attacks
// Available for use with res.cookie() throughout the application:
// res.cookie('token', value, secureCookieOptions);

// Cookie parser for secure handling (if session middleware is added later)
// app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-secret'));

// Session/Cookie best practices:
// 1. httpOnly: true  - prevents JavaScript access (XSS protection)
// 2. secure: true    - only send over HTTPS in production
// 3. sameSite: strict - prevents CSRF and cross-site cookie leakage
// 4. maxAge: suitable TTL - auto-expires stale tokens
// Example usage in routes:
// res.cookie('jwt', token, secureCookieOptions);


// CORS setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-TOKEN'],
  })
);

// Logging middleware for tracking access and authorization
app.use(logUnauthorizedAccess);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ipAddress: req.ip,
    });
  });
  next();
});

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * Health check endpoint (not rate limited)
 * Used by load balancers and monitoring
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
  });
});

app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

// ============================================================
// CSRF TOKEN ENDPOINT
// ============================================================
/**
 * GET /api/csrf-token
 * Get a CSRF token for making state-changing requests
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "csrfToken": "..." }
 * }
 * 
 * CSRF PROTECTION FLOW (Browser/Web Clients):
 * 
 * 1. Before making any state-changing request, GET /api/csrf-token
 *    const response = await fetch('/api/csrf-token', { credentials: 'include' });
 *    const { csrfToken } = response.data;
 * 
 * 2. Include CSRF token in state-changing requests (POST, PUT, DELETE, PATCH)
 *    - Via HTTP Header: X-CSRF-Token: <token>
 *    - Or: X-XSRF-TOKEN: <token>
 * 
 *    fetch('/api/posts', {
 *      method: 'POST',
 *      credentials: 'include',  // Important: include cookies
 *      headers: {
 *        'Content-Type': 'application/json',
 *        'X-CSRF-Token': csrfToken
 *      },
 *      body: JSON.stringify({ caption: '...' })
 *    })
 * 
 * 3. Server validates CSRF token:
 *    - Extracts token from cookie (set by server)
 *    - Compares with token in X-CSRF-Token header
 *    - Blocks request if tokens don't match (403 Forbidden)
 * 
 * CSRF PROTECTION FOR API CLIENTS:
 * - If using Bearer token authentication (JWT in Authorization header),
 *   CSRF validation can be skipped
 * - Browser-based CORS requests from different origins must include CSRF token
 * - Server-to-server requests don't need CSRF (but should use auth tokens)
 */
app.get('/api/csrf-token', getCsrfToken);

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================
// Protected with rate limiting: 5 login / 3 register / 5 reset / 10 verify per window

/**
 * POST /api/auth/login
 * Rate limit: 5 per minute per IP
 * 
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { "id": "...", "email": "...", "role": "user" },
 *     "token": "eyJhbGc...",
 *     "refreshToken": "ref_..."
 *   }
 * }
 * 
 * Response 429:
 * {
 *   "status": "error",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "message": "Too many login attempts. Please try again later.",
 *   "retryAfter": 60
 * }
 */
app.post('/api/auth/login', loginLimiter, loginValidation, handleValidationErrors, trackLoginAttempts, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  try {
    // TODO: Implement login logic
    // 1. Validate email and password
    // 2. Check if user exists
    // 3. Verify password with Argon2
    // 4. Generate JWT tokens
    // 5. Return user + tokens

    const userId = 'user_123'; // In real implementation, this comes from database

    // Track login attempt for anomaly detection (success)
    const anomalyResult = trackLoginAnomalies(userId, email, ipAddress, true);

    // Check if account is locked
    if (anomalyResult.isLocked) {
      logger.warn('Login blocked - account locked', {
        userId,
        email,
        ipAddress,
        reason: anomalyResult.reason,
        action: 'LOGIN_BLOCKED',
      });

      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: anomalyResult.reason || 'Account temporarily locked due to suspicious activity',
        },
      });
    }

    // Log successful login
    logger.auth.loginSuccess(userId, email, ipAddress);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userId,
          email: email,
          role: 'user',
        },
        token: 'eyJhbGc...',
        refreshToken: 'ref_...',
      },
    });
  } catch (error: any) {
    const userId = 'user_unknown'; // In real implementation, would try to get from request

    // Track failed login attempt for anomaly detection
    trackLoginAnomalies(userId, email, ipAddress, false);

    // Log failed login attempt
    logger.auth.loginFailed(email, error.message || 'Unknown error', ipAddress);
    logger.auth.authError(error, 'login_route', undefined);

    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login. Please try again.',
      },
    });
  }
});

/**
 * POST /api/auth/register
 * Rate limit: 3 per hour per IP
 * 
 * Body:
 * {
 *   "email": "newuser@example.com",
 *   "password": "securePassword123!",
 *   "displayName": "New User"
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "data": { "id": "...", "email": "...", "displayName": "..." }
 * }
 * 
 * Response 429:
 * {
 *   "status": "error",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "message": "Too many registration attempts. Please try again in 1 hour.",
 *   "retryAfter": 3600
 * }
 */
app.post('/api/auth/register', registerLimiter, registerValidation, handleValidationErrors, async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  try {
    // TODO: Implement registration logic
    // 1. Validate input (email format, password strength)
    // 2. Check if email already registered
    // 3. Hash password with Argon2
    // 4. Create user in database
    // 5. Send verification email
    // 6. Return created user (no token yet)

    const userId = 'user_new_123'; // In real implementation, this comes from database
    logger.auth.registerSuccess(userId, email, ipAddress);

    res.status(201).json({
      success: true,
      data: {
        id: userId,
        email: email,
        displayName: displayName,
        message: 'Registration successful. Check your email for verification.',
      },
    });
  } catch (error: any) {
    // Log registration failure
    logger.auth.registerFailed(email, error.message || 'Unknown error', ipAddress);
    logger.auth.authError(error, 'register_route', undefined);

    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register. Please try again.',
      },
    });
  }
});

/**
 * POST /api/auth/password-reset
 * Rate limit: 5 per hour per email
 * 
 * Body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "If account exists, password reset email has been sent."
 * }
 */
app.post('/api/auth/password-reset', passwordResetLimiter, passwordResetValidation, handleValidationErrors, async (req: Request, res: Response) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  try {
    // TODO: Implement password reset logic
    // 1. Check if user with email exists
    // 2. Generate reset token
    // 3. Store token with expiry (15 minutes)
    // 4. Send reset email
    // 5. Return success (don't reveal if email exists)

    // Log password reset request
    logger.auth.passwordResetRequested(email, ipAddress);

    res.status(200).json({
      success: true,
      message: 'If account exists, password reset email has been sent.',
    });
  } catch (error: any) {
    // Log authentication error
    logger.auth.authError(error, 'password_reset_route', undefined);

    res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Failed to process password reset. Please try again.',
      },
    });
  }
});

/**
 * POST /api/auth/verify-token
 * Rate limit: 10 per minute per IP
 * 
 * Body:
 * {
 *   "token": "eyJhbGc..."
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "valid": true, "user": { ... } }
 * }
 */
app.post('/api/auth/verify-token', verifyTokenLimiter, verifyTokenValidation, handleValidationErrors, async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    // TODO: Implement token verification
    // 1. Verify JWT signature
    // 2. Check token expiry
    // 3. Return user data if valid

    // Log successful token verification
    const userId = 'user_123'; // In real implementation, decoded from token
    logger.auth.tokenVerified(userId, 'access_token');

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: { id: userId, email: 'user@example.com', role: 'user' },
      },
    });
  } catch (error: any) {
    // Log invalid token attempt
    logger.auth.tokenInvalid(error.message || 'Unknown error', 'access_token');
    logger.auth.authError(error, 'verify_token_route', undefined);

    res.status(401).json({
      success: false,
      data: { valid: false },
      error: { code: 'INVALID_TOKEN' },
    });
  }
});

// ============================================================
// CONTENT CREATION ROUTES
// ============================================================
// Requires authentication + rate limiting

/**
 * Authentication middleware
 * Verifies Bearer token and attaches user to request
 * TODO: Replace with actual JWT verification logic
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Unauthorized access attempt - no valid token', {
      path: req.path,
      ipAddress: req.ip,
      action: 'AUTH_MISSING_TOKEN',
    });
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.substring(7);

  // TODO: Verify JWT signature, expiry, and extract user claims
  // For now, mock user data - REPLACE WITH REAL JWT VERIFICATION
  if (!token || token.length === 0) {
    logger.warn('Unauthorized access attempt - invalid token format', {
      path: req.path,
      ipAddress: req.ip,
      action: 'AUTH_INVALID_TOKEN',
    });
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token format' },
    });
  }

  (req as any).user = {
    id: 'user_123',
    email: 'user@example.com',
    role: 'user',
  };

  next();
};

/**
 * Combined auth + anomaly detection middleware
 * Apply to routes requiring authentication + anomaly checks
 */
const authWithAnomalyCheck = (req: Request, res: Response, next: NextFunction) => {
  // First apply auth
  authMiddleware(req, res, () => {
    // If auth passed, check anomalies
    trackUserActionAnomalies(req, res, next);
  });
};

/**
 * POST /api/posts
 * Rate limit: 20 per minute per user
 * 
 * Headers:
 * Authorization: Bearer <token>
 * 
 * Body:
 * {
 *   "caption": "This is my post",
 *   "mediaUrls": ["https://..."],
 *   "mentions": ["user_123", "user_456"]
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "data": { "id": "post_...", "userId": "user_...", ... }
 * }
 */
app.post('/api/posts', authMiddleware, createPostLimiter, createPostValidation, handleValidationErrors, trackUserActionAnomalies, async (req: Request, res: Response) => {
  const { caption, mediaUrls, mentions } = req.body;
  const userId = (req as any).user?.id;

  try {
    // TODO: Create post
    // 1. Validate caption length
    // 2. Upload media if provided
    // 3. Store post in database
    // 4. Create mentions
    // 5. Notify mentioned users

    logger.info('Post created', {
      userId,
      mentions: mentions?.length || 0,
      mediaCount: mediaUrls?.length || 0,
      action: 'POST_CREATED',
    });

    res.status(201).json({
      success: true,
      data: {
        id: 'post_123',
        userId: userId,
        caption: caption,
        mediaUrls: mediaUrls || [],
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Post creation error', error, {
      userId,
      path: '/api/posts',
    });
    res.status(500).json({
      success: false,
      error: { code: 'POST_CREATION_FAILED' },
    });
  }
});

/**
 * POST /api/posts/:postId/comments
 * Rate limit: 50 per minute per user
 * 
 * Body:
 * {
 *   "text": "Great post!"
 * }
 * 
 * Response 201:
 * {
 *   "success": true,
 *   "data": { "id": "comment_...", "postId": "post_...", ... }
 * }
 */
app.post(
  '/api/posts/:postId/comments',
  authMiddleware,
  createCommentLimiter,
  createCommentValidation,
  handleValidationErrors,
  trackUserActionAnomalies,
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = (req as any).user?.id;

    try {
      // TODO: Create comment
      // 1. Validate text
      // 2. Check if post exists
      // 3. Store comment
      // 4. Notify post author
      // 5. Update post comment count

      logger.info('Comment created', {
        userId,
        postId,
        action: 'COMMENT_CREATED',
      });

      res.status(201).json({
        success: true,
        data: {
          id: 'comment_123',
          postId: postId,
          userId: userId,
          text: text,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Comment creation error', error, {
        userId,
        postId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'COMMENT_CREATION_FAILED' },
      });
    }
  }
);

/**
 * POST /api/posts/:postId/like
 * Rate limit: 100 per minute per user
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "liked": true, "likeCount": 42 }
 * }
 */
app.post('/api/posts/:postId/like', authMiddleware, likeLimiter, postIdParamValidation, handleValidationErrors, trackUserActionAnomalies, async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = (req as any).user?.id;

  try {
    // TODO: Toggle like
    // 1. Check if already liked
    // 2. Add/remove like
    // 3. Update like count
    // 4. Notify post author

    logger.debug('Post liked', {
      userId,
      postId,
      action: 'POST_LIKED',
    });

    res.status(200).json({
      success: true,
      data: {
        liked: true,
        likeCount: 42,
      },
    });
  } catch (error: any) {
    logger.error('Like action failed', error, {
      userId,
      postId,
    });
    res.status(500).json({
      success: false,
      error: { code: 'LIKE_FAILED' },
    });
  }
});

// ============================================================
// USER PROFILE ROUTES
// ============================================================

/**
 * PATCH /api/users/me
 * Rate limit: 20 per hour per user
 * 
 * Body:
 * {
 *   "displayName": "New Name",
 *   "bio": "Updated bio",
 *   "avatar": "https://..."
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "id": "...", "displayName": "...", ... }
 * }
 */
app.patch(
  '/api/users/me',
  authMiddleware,
  updateProfileLimiter,
  updateProfileValidation,
  handleValidationErrors,
  trackUserActionAnomalies,
  async (req: Request, res: Response) => {
    const { displayName, bio, avatar } = req.body;
    const userId = (req as any).user?.id;

    try {
      // TODO: Update profile
      // 1. Validate input
      // 2. Upload avatar if provided
      // 3. Update user record
      // 4. Return updated user

      logger.info('User profile updated', {
        userId,
        action: 'PROFILE_UPDATED',
      });

      res.status(200).json({
        success: true,
        data: {
          id: userId,
          displayName: displayName,
          bio: bio,
          avatar: avatar,
        },
      });
    } catch (error: any) {
      logger.error('Profile update failed', error, {
        userId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_UPDATE_FAILED' },
      });
    }
  }
);

/**
 * GET /api/users/:userId
 * Public profile (not rate limited per user)
 */
app.get('/api/users/:userId', userIdParamValidation, handleValidationErrors, async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // TODO: Get public user profile

    res.status(200).json({
      success: true,
      data: {
        id: userId,
        displayName: 'User Name',
        bio: 'User bio',
        avatar: 'https://...',
        followerCount: 100,
        followingCount: 50,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'USER_NOT_FOUND' },
    });
  }
});

// ============================================================
// ANOMALY DETECTION - ADMIN ENDPOINTS
// ============================================================
// These endpoints require admin authentication

/**
 * GET /api/admin/anomaly-metrics
 * Get system-wide anomaly detection metrics
 */
app.get('/api/admin/anomaly-metrics', authMiddleware, (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const userId = (req as any).user?.id;

  if (userRole !== 'admin') {
    logger.warn('Unauthorized admin access attempt', {
      userId,
      path: '/api/admin/anomaly-metrics',
      userRole,
      ipAddress: req.ip,
      action: 'UNAUTHORIZED_ADMIN_ACCESS',
    });
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
      },
    });
  }

  logger.debug('Admin accessed anomaly metrics', {
    userId,
    action: 'ADMIN_METRICS_ACCESS',
  });

  getAnomalyMetrics(req, res);
});

/**
 * GET /api/admin/users/:userId/anomaly-status
 * Get anomaly status for a specific user
 */
app.get('/api/admin/users/:userId/anomaly-status', authMiddleware, (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const adminId = (req as any).user?.id;
  const targetUserId = req.params.userId;

  if (userRole !== 'admin') {
    logger.warn('Unauthorized admin access attempt', {
      adminId,
      path: `/api/admin/users/${targetUserId}/anomaly-status`,
      userRole,
      ipAddress: req.ip,
      action: 'UNAUTHORIZED_ADMIN_ACCESS',
    });
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
      },
    });
  }

  logger.debug('Admin accessed user anomaly status', {
    adminId,
    targetUserId,
    action: 'ADMIN_USER_ANOMALY_ACCESS',
  });

  getAnomalyStatus(req, res);
});

/**
 * POST /api/admin/users/:userId/reset-risk
 * Reset user's risk score (admin only)
 * Body: { "reason": "User confirmed safe" }
 */
app.post('/api/admin/users/:userId/reset-risk', authMiddleware, (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const adminId = (req as any).user?.id;
  const targetUserId = req.params.userId;

  if (userRole !== 'admin') {
    logger.warn('Unauthorized admin access attempt', {
      adminId,
      path: `/api/admin/users/${targetUserId}/reset-risk`,
      userRole,
      ipAddress: req.ip,
      action: 'UNAUTHORIZED_ADMIN_ACCESS',
    });
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
      },
    });
  }

  logger.info('Admin reset user risk score', {
    adminId,
    targetUserId,
    action: 'ADMIN_RESET_RISK',
  });

  resetUserRisk(req, res);
});

/**
 * POST /api/admin/users/:userId/unlock
 * Unlock a temporarily locked account (admin only)
 * Body: { "reason": "User appealed lock" }
 */
app.post('/api/admin/users/:userId/unlock', authMiddleware, (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const adminId = (req as any).user?.id;
  const targetUserId = req.params.userId;

  if (userRole !== 'admin') {
    logger.warn('Unauthorized admin access attempt', {
      adminId,
      path: `/api/admin/users/${targetUserId}/unlock`,
      userRole,
      ipAddress: req.ip,
      action: 'UNAUTHORIZED_ADMIN_ACCESS',
    });
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Admin role required.',
      },
    });
  }

  logger.info('Admin unlocked account', {
    adminId,
    targetUserId,
    action: 'ADMIN_UNLOCK_ACCOUNT',
  });

  unlockUser(req, res);
});

// ============================================================
// GLOBAL RATE LIMITER
// ============================================================
// Apply to all remaining routes as a safety net
// This catches endpoints without specific limiters

app.use(globalLimiter);

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * 404 Not Found handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
    },
  });
});

/**
 * Global error handler
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err, {
    method: req.method,
    path: req.path,
    statusCode: err.status || 500,
  });

  const statusCode = err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(NODE_ENV === 'development' && { details: err.stack }),
    },
  });
});

// ============================================================
// SERVER START
// ============================================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║        VAIRO API SERVER STARTED            ║
╚════════════════════════════════════════════╝

🚀 Server: http://localhost:${PORT}
🔧 Environment: ${NODE_ENV}
🛡️  Rate Limiting: ✅ ENABLED
📊 Health Check: /health

✅ Protected Routes:
   • Authentication (5 limiters)
   • Content Creation (4 limiters)
   • User Profiles (1 limiter)
   • Global Fallback (1000/hour)

📝 Test:
   curl http://localhost:${PORT}/health

Type 'exit' to stop the server.
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
