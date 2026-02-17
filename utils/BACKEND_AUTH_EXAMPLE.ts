/**
 * Backend API Example - Authentication Routes
 * 
 * This file demonstrates how to implement secure password handling
 * on the server side using argon2.
 * 
 * IMPORTANT: This is an EXAMPLE for your backend API.
 * Do NOT run this in the client app - it's meant for Node.js/Express backend.
 * 
 * @example
 * // Install dependencies:
 * // npm install argon2 express jsonwebtoken
 * 
 * // Usage in your backend API:
 * import express from 'express';
 * import { registerHandler, loginHandler } from './auth-routes';
 * 
 * const app = express();
 * app.post('/auth/register', registerHandler);
 * app.post('/auth/login', loginHandler);
 */

import { hashPassword, verifyPassword } from '@/utils/passwordHash';
import { getEnv } from '@/utils/envValidator';

/**
 * BACKEND IMPLEMENTATION EXAMPLE
 * 
 * This shows how to securely implement password hashing in your backend API.
 * It assumes you have:
 * - Express.js server
 * - Database (PostgreSQL, MongoDB, etc)
 * - JWT library for token generation
 */

// =============================================================================
// USER REGISTRATION ENDPOINT
// =============================================================================

/**
 * @route POST /auth/register
 * @param {string} email - User email
 * @param {string} password - User password (plain text, sent over HTTPS)
 * @returns {object} { userId, email }
 */
export async function registerHandler(req: any, res: any) {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // 2. Check if user exists
    // const existingUser = await db.users.findByEmail(email);
    // if (existingUser) {
    //   return res.status(409).json({
    //     message: 'Email already registered',
    //   });
    // }

    // 3. Hash password with argon2
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
    } catch (error) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
      });
    }

    // 4. Create user in database (with hashed password ONLY)
    // DON'T store plain password!
    // const user = await db.users.create({
    //   email: email.toLowerCase(),
    //   passwordHash: hashedPassword,
    //   createdAt: new Date(),
    // });

    // 5. Return success (DO NOT return password hash)
    return res.status(201).json({
      userId: 'user_id_here',
      email: email.toLowerCase(),
      // DO NOT include: passwordHash, password
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Registration failed',
    });
  }
}

// =============================================================================
// USER LOGIN ENDPOINT
// =============================================================================

/**
 * @route POST /auth/login
 * @param {string} email - User email
 * @param {string} password - User password (plain text, sent over HTTPS)
 * @returns {object} { userId, email, token, expiresAt }
 */
export async function loginHandler(req: any, res: any) {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      // Use generic message to prevent account enumeration
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // 2. Find user in database
    // const user = await db.users.findByEmail(email.toLowerCase());
    // if (!user) {
    //   // Generic error message
    //   return res.status(401).json({
    //     message: 'Invalid email or password',
    //   });
    // }

    // 3. Verify password with argon2
    // const isPasswordValid = await verifyPassword(password, user.passwordHash);
    // if (!isPasswordValid) {
    //   // Log failed attempt for security
    //   await logFailedLoginAttempt(email);
    //   
    //   // Generic error message
    //   return res.status(401).json({
    //     message: 'Invalid email or password',
    //   });
    // }

    // 4. Check account status
    // if (user.isLocked || !user.isActive) {
    //   return res.status(403).json({
    //     message: 'Account is disabled',
    //   });
    // }

    // 5. Generate JWT token
    // const token = generateJWT(user.id, {
    //   expiresIn: '7d', // 7 day expiration
    // });

    // 6. Update last login timestamp
    // await db.users.update(user.id, {
    //   lastLoginAt: new Date(),
    // });

    // 7. Return token (DO NOT return password hash)
    return res.status(200).json({
      userId: 'user_id_here',
      email: email.toLowerCase(),
      token: 'jwt_token_here',
      expiresAt: Math.floor(Date.now() / 1000) + 604800, // 7 days from now
      // DO NOT include: passwordHash, password
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Login failed',
    });
  }
}

// =============================================================================
// BACKEND SECURITY CHECKLIST
// =============================================================================

/**
 * SECURITY REQUIREMENTS FOR PASSWORD HANDLING
 * 
 * ✅ MUST DO:
 * 
 * 1. Password Hashing
 *    - ✓ Use argon2 for hashing
 *    - ✓ Hash passwords BEFORE storing in database
 *    - ✓ Never store plain text passwords
 *    - ✓ Use strong parameters (see utils/passwordHash.ts)
 * 
 * 2. Password Verification
 *    - ✓ Use argon2.verify() for checking passwords
 *    - ✓ Compare against stored hash only
 *    - ✓ Use constant-time comparison
 *    - ✓ Return generic error messages
 * 
 * 3. HTTPS/TLS
 *    - ✓ Accept passwords only over HTTPS/TLS 1.2+
 *    - ✓ Redirect HTTP traffic to HTTPS
 *    - ✓ Implement HSTS headers
 *    - ✓ Use strong cipher suites
 * 
 * 4. Rate Limiting
 *    - ✓ Limit login attempts (e.g., 5 per 15 minutes)
 *    - ✓ Implement exponential backoff
 *    - ✓ Lock accounts after multiple failures
 *    - ✓ Log and monitor failed attempts
 * 
 * 5. Account Security
 *    - ✓ Validate email before allowing registration
 *    - ✓ Implement email verification
 *    - ✓ Require strong passwords (8+ chars, mixed case, numbers, symbols)
 *    - ✓ Support password reset with secure tokens
 *    - ✓ Add multi-factor authentication (MFA)
 * 
 * 6. Token Management
 *    - ✓ Use JWT with expiration times (7-30 days)
 *    - ✓ Implement refresh tokens
 *    - ✓ Validate token signatures
 *    - ✓ Revoke tokens on logout
 *    - ✓ Store refresh tokens securely (HttpOnly cookies)
 * 
 * 7. Logging & Monitoring
 *    - ✓ Log authentication events (not passwords)
 *    - ✓ Monitor for brute force attacks
 *    - ✓ Alert on suspicious activities
 *    - ✓ Keep audit trail of authentication changes
 *    - ✓ Rotate logs regularly
 * 
 * 8. Error Handling
 *    - ✓ Use generic error messages (no account enumeration)
 *    - ✓ Log actual errors server-side
 *    - ✓ Don't expose database errors to client
 *    - ✓ Implement proper error codes
 *    - ✓ Don't reveal implementation details
 * 
 * ❌ NEVER DO:
 * 
 * - ✗ Hash passwords on the client side
 * - ✗ Use weak hashing (MD5, SHA1, bcrypt without salt)
 * - ✗ Send passwords in emails or SMS
 * - ✗ Store plain text passwords
 * - ✗ Use the same password hash for all users
 * - ✗ Log or display plain text passwords
 * - ✗ Use passwords in URLs or query parameters
 * - ✗ Send passwords in unencrypted connections
 * - ✗ Reveal error messages that indicate whether account exists
 * - ✗ Use passwords obtained from previous breaches
 * 
 * COMPLIANCE:
 * - GDPR: Proper password storage and user data protection
 * - CCPA: User data security and privacy
 * - OWASP: Authentication best practices
 * - PCI DSS: If handling payment information
 * - SOC 2: Security and availability standards
 */

// =============================================================================
// IMPLEMENTATION STEPS
// =============================================================================

/**
 * To implement this in your backend:
 * 
 * 1. Install dependencies:
 *    npm install argon2 express jsonwebtoken bcrypt
 * 
 * 2. Copy hashPassword and verifyPassword from utils/passwordHash.ts
 *    to your backend server
 * 
 * 3. Use in your authentication routes:
 *    const hashedPassword = await hashPassword(plainPassword);
 *    const isValid = await verifyPassword(plainPassword, storedHash);
 * 
 * 4. Store only the hash in the database:
 *    db.users.create({
 *      email: email,
 *      passwordHash: hashedPassword,  // Store hash only!
 *    });
 * 
 * 5. Implement rate limiting:
 *    app.use(rateLimiter({
 *      windowMs: 15 * 60 * 1000,   // 15 minutes
 *      max: 5,                      // 5 attempts
 *    }));
 * 
 * 6. Use environment variables for secrets:
 *    const JWT_SECRET = process.env.JWT_SECRET;
 *    const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
 * 
 * 7. Validate all inputs before processing
 * 
 * 8. Return consistent error responses
 */
