/**
 * Backend Authentication Middleware - Express.js Examples
 * 
 * ⚠️ IMPORTANT: This file is for BACKEND (Node.js) only
 * Do NOT import this in the client app
 * 
 * Demonstrates how to implement:
 * - Token validation middleware
 * - Protected route setup
 * - Token refresh endpoint
 * - Token blacklist/revocation
 * - Access & refresh token management
 * 
 * Backend Setup:
 * npm install express jsonwebtoken cookie-parser
 * 
 * @usage
 * // In your backend server (Node.js)
 * import express from 'express';
 * import { authMiddleware, refreshTokenHandler } from './auth-middleware';
 * 
 * const app = express();
 * 
 * app.post('/auth/refresh', refreshTokenHandler);
 * app.post('/auth/logout', authMiddleware, logoutHandler);
 * app.get('/api/protected', authMiddleware, protectedHandler);
 */

// @ts-ignore - Backend dependencies not available in client app
import jwt from 'jsonwebtoken';
// @ts-ignore - Express types only for backend
import { Request, Response, NextFunction } from 'express';

/**
 * JWT Configuration
 * Set these environment variables on your backend server
 */
const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const ACCESS_TOKEN_EXPIRES = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRES = '7d';  // 7 days

/**
 * Token Blacklist - tracks revoked tokens
 * In production, use Redis or a database for persistent storage
 * 
 * Example Redis implementation:
 * const redis = require('redis');
 * const client = redis.createClient();
 * 
 * async function isTokenBlacklisted(token) {
 *   const result = await client.get(`blacklist:${token}`);
 *   return result !== null;
 * }
 * 
 * async function blacklistToken(token, expiresIn) {
 *   await client.setex(`blacklist:${token}`, expiresIn, 'true');
 * }
 */
const tokenBlacklist = new Set<string>();

/**
 * Add token to blacklist (on logout)
 * In production, use Redis with TTL instead of in-memory Set
 * 
 * @param token - JWT token to revoke
 * @param expiresIn - Token lifetime in seconds (for Redis TTL)
 */
function blacklistToken(token: string, expiresIn: number = 900): void {
  tokenBlacklist.add(token);
  
  // TODO: Use Redis instead:
  // await redis.setex(`blacklist:${token}`, expiresIn, 'true');
}

/**
 * Check if token is blacklisted
 * 
 * @param token - JWT token to check
 * @returns boolean - True if token is blacklisted (revoked)
 */
function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
  
  // TODO: Use Redis instead:
  // const result = await redis.get(`blacklist:${token}`);
  // return result !== null;
}

/**
 * Express middleware for authenticating requests
 * Validates JWT access token and extracts user info
 * 
 * BACKEND ONLY - For Node.js Express server
 * 
 * USAGE:
 * app.get('/api/posts', authMiddleware, (req, res) => {
 *   const userId = req.user.userId; // From middleware
 * });
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next middleware
 */
export function authMiddleware(req: any, res: any, next: any): void {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authorization token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // 2. Check if token is blacklisted (revoked)
    if (isTokenBlacklisted(token)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked. Please login again',
        },
      });
      return;
    }

    // 3. Verify token signature and expiration
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      role?: string;
      iat: number;
      exp: number;
      type: 'access';
    };

    // 4. Verify token type is 'access' (not refresh)
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
      });
      return;
    }

    // 5. Attach user info to request for next handler
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user', // Default to 'user' if not present
    };

    next();
  } catch (error: any) {
    // Handle JWT validation errors
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please refresh',
        },
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Generate access token (short-lived, 15 minutes)
 * 
 * @param userId - User ID to encode
 * @param email - User email to encode
 * @param role - User role (default: 'user')
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, email: string, role: string = 'user'): string {
  return jwt.sign(
    {
      userId,
      email,
      role, // Include user role in token
      type: 'access', // Identify as access token
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES } // 15 minutes
  );
}

/**
 * Generate refresh token (long-lived, 7 days)
 * Sent to client in HTTP-only cookie (not returned in JSON)
 * 
 * @param userId - User ID to encode
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'refresh', // Identify as refresh token
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES } // 7 days
  );
}

/**
 * Login endpoint - generates both tokens
 * 
 * BACKEND ONLY - For Node.js Express server
 * 
 * @example
 * POST /auth/login
 * Content-Type: application/json
 * 
 * {
 *   "email": "user@example.com",
 *   "password": "plaintext_password"
 * }
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "user_123",
 *     "email": "user@example.com",
 *     "accessToken": "eyJhbGc...",
 *     "expiresIn": 900
 *   }
 * }
 * 
 * Note: Refresh token is in httpOnly cookie, not in response body
 */
export async function loginHandler(req: any, res: any): Promise<void> {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password required',
        },
      });
      return;
    }

    // 2. Find user by email
    // const user = await db.users.findByEmail(email.toLowerCase());
    // if (!user) {
    //   return res.status(401).json({
    //     success: false,
    //     error: {
    //       code: 'INVALID_CREDENTIALS',
    //       message: 'Invalid email or password',
    //     },
    //   });
    // }

    // 3. Verify password (using argon2 from utils/passwordHash.ts)
    // const { verifyPassword } = require('@/utils/passwordHash');
    // const isPasswordValid = await verifyPassword(password, user.passwordHash);
    // if (!isPasswordValid) {
    //   return res.status(401).json({
    //     success: false,
    //     error: {
    //       code: 'INVALID_CREDENTIALS',
    //       message: 'Invalid email or password',
    //     },
    //   });
    // }

    // 4. Generate tokens
    // const userId = user.id;
    // const accessToken = generateAccessToken(userId, email, user.role);
    // const refreshToken = generateRefreshToken(userId);

    // 5. Send access token in response body
    // Send refresh token in httpOnly secure cookie (client cannot access)
    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,      // Cannot be accessed by JavaScript
    //   secure: true,        // HTTPS only
    //   sameSite: 'strict',  // CSRF protection
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    res.status(200).json({
      success: true,
      data: {
        userId: 'user_id_here',
        email: email.toLowerCase(),
        accessToken: 'jwt_access_token_here',
        expiresIn: 900, // 15 minutes in seconds
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Login failed',
      },
    });
  }
}

/**
 * Refresh endpoint - issues new access token using refresh token
 * 
 * BACKEND ONLY - For Node.js Express server
 * 
 * FLOW:
 * 1. Client calls POST /auth/refresh
 * 2. Browser automatically sends refreshToken cookie (httpOnly)
 * 3. Server validates refreshToken and generates new accessToken
 * 4. Server sends new accessToken in response body
 * 5. Server optionally rotates refreshToken (send new one in cookie)
 * 
 * @example
 * POST /auth/refresh
 * Cookie: refreshToken=eyJhbGc...
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGc...",
 *     "expiresIn": 900
 *   }
 * }
 */
export function refreshTokenHandler(req: any, res: any): void {
  try {
    // 1. Extract refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not found',
        },
      });
      return;
    }

    // 2. Check if token is blacklisted
    if (isTokenBlacklisted(refreshToken)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Refresh token has been revoked',
        },
      });
      return;
    }

    // 3. Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh token expired. Please login again',
          },
        });
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token',
          },
        });
      }
      return;
    }

    // 4. Verify token type
    if (decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
      });
      return;
    }

    // 5. Generate new access token
    // Optionally regenerate refresh token (token rotation)
    // const userId = decoded.userId;
    // const user = await db.users.findById(userId);

    // Generate new accessToken
    // const newAccessToken = generateAccessToken(userId, user.email);

    // Optional: Rotate refresh token (issue new one)
    // const newRefreshToken = generateRefreshToken(userId);
    // res.cookie('refreshToken', newRefreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.status(200).json({
      success: true,
      data: {
        accessToken: 'new_jwt_access_token_here',
        expiresIn: 900, // 15 minutes
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token',
      },
    });
  }
}

/**
 * Logout endpoint - revokes both tokens
 * 
 * BACKEND ONLY - For Node.js Express server
 * 
 * FLOW:
 * 1. Client calls POST /auth/logout with access token
 * 2. Server adds both tokens to blacklist
 * 3. Server clears httpOnly refresh token cookie
 * 4. Client clears memory-stored access token
 * 
 * @example
 * POST /auth/logout
 * Authorization: Bearer <access_token>
 * Cookie: refreshToken=<refresh_token>
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
export function logoutHandler(req: any, res: any): void {
  try {
    // Required: authMiddleware must be applied first to attach req.user
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    // 1. Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    // 2. Calculate token expiration time
    const accessTokenExpiry = 15 * 60; // 15 minutes in seconds
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds

    // 3. Add both tokens to blacklist
    // Access token from Authorization header (auto-extracted by client)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      blacklistToken(accessToken, accessTokenExpiry);
    }

    // Refresh token from cookie
    if (refreshToken) {
      blacklistToken(refreshToken, refreshTokenExpiry);
    }

    // 4. Clear refresh token cookie
    res.clearCookie('refreshToken');

    // 5. Log logout event
    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Logout failed',
      },
    });
  }
}

/**
 * Protected route example
 * 
 * BACKEND ONLY - For Node.js Express server
 * 
 * Usage:
 * app.get('/api/posts', authMiddleware, postsHandler);
 * 
 * The authMiddleware will:
 * 1. Validate access token
 * 2. Check token expiration
 * 3. Verify token signature
 * 4. Attach user info to req
 * 5. Block request if any check fails
 */
export function protectedRouteExample(req: any, res: any): void {
  // User info attached by authMiddleware
  const userId = (req as any).user.userId;
  const email = (req as any).user.email;

  res.status(200).json({
    success: true,
    message: `Hello ${email}`,
    userId,
  });
}

/**
 * BACKEND SETUP CHECKLIST
 * 
 * ✓ Install dependencies:
 *   npm install express jsonwebtoken cookie-parser
 * 
 * ✓ Environment variables in .env:
 *   JWT_SECRET=your-secret-key (min 32 characters)
 *   JWT_REFRESH_SECRET=your-refresh-secret
 * 
 * ✓ Express setup:
 *   const express = require('express');
 *   const cookieParser = require('cookie-parser');
 *   const app = express();
 *   
 *   app.use(express.json());
 *   app.use(cookieParser());
 * 
 * ✓ Routes:
 *   app.post('/auth/login', loginHandler);
 *   app.post('/auth/logout', authMiddleware, logoutHandler);
 *   app.post('/auth/refresh', refreshTokenHandler);
 *   app.get('/api/posts', authMiddleware, getPostsHandler);
 * 
 * ✓ Token lifecycle:
 *   - Access token: 15 minutes (short-lived)
 *   - Refresh token: 7 days (long-lived)
 *   - Token rotation: Optional on refresh
 *   - Blacklist: Revoked tokens (Redis recommended)
 * 
 * ✓ Security headers:
 *   app.use((req, res, next) => {
 *     res.header('X-Content-Type-Options', 'nosniff');
 *     res.header('X-Frame-Options', 'DENY');
 *     res.header('X-XSS-Protection', '1; mode=block');
 *     next();
 *   });
 * 
 * ✓ HTTPS:
 *   Always use HTTPS in production
 *   Set secure: true in cookie options
 * 
 * ✓ Rate limiting:
 *   const rateLimit = require('express-rate-limit');
 *   const limiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
 *   app.post('/auth/login', limiter, loginHandler);
 */
