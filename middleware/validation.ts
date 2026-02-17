/**
 * INPUT VALIDATION & SANITIZATION MIDDLEWARE
 * 
 * ✅ Email format validation
 * ✅ Strong password enforcement
 * ✅ XSS prevention via sanitization
 * ✅ Input type checking
 * ✅ Length constraints
 * ✅ Parameterized queries ready (prevent SQL injection)
 * 
 * Uses express-validator for comprehensive validation
 * 
 * Installation:
 * npm install express-validator
 */

// @ts-ignore - express-validator installed in backend only
import { body, param, validationResult, sanitizeHtml } from 'express-validator';
// @ts-ignore
import type { Request, Response, NextFunction } from 'express';

// ============================================================
// PASSWORD VALIDATION RULES
// ============================================================

/**
 * Strong password requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*)
 * 
 * This prevents weak passwords that could be brute-forced
 */
const strongPasswordRule = (value: string) => {
  // Check minimum length
  if (value.length < 12) {
    throw new Error(
      'Password must be at least 12 characters long'
    );
  }

  // Check for uppercase
  if (!/[A-Z]/.test(value)) {
    throw new Error(
      'Password must contain at least one uppercase letter'
    );
  }

  // Check for lowercase
  if (!/[a-z]/.test(value)) {
    throw new Error(
      'Password must contain at least one lowercase letter'
    );
  }

  // Check for number
  if (!/[0-9]/.test(value)) {
    throw new Error(
      'Password must contain at least one number'
    );
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    throw new Error(
      'Password must contain at least one special character (!@#$%^&*())'
    );
  }

  return true;
};

// ============================================================
// VALIDATION RULES FOR EACH ROUTE
// ============================================================

/**
 * LOGIN VALIDATION
 * 
 * - Email: Valid format, max 255 chars
 * - Password: Non-empty, max 256 chars (limit to prevent memory attacks)
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long (max 255 characters)'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 256 })
    .withMessage('Password must be between 8-256 characters'),
];

/**
 * REGISTER VALIDATION
 * 
 * - Email: Valid format, max 255 chars
 * - Password: Strong password (12+ chars, mixed case, numbers, special)
 * - DisplayName: 1-100 chars, no HTML/scripts
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long (max 255 characters)'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom(strongPasswordRule),

  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be 1-100 characters')
    .escape()
    .withMessage('Display name contains invalid characters'),
];

/**
 * PASSWORD RESET VALIDATION
 * 
 * - Email: Valid format, max 255 chars
 */
export const passwordResetValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long (max 255 characters)'),
];

/**
 * TOKEN VERIFICATION VALIDATION
 * 
 * - Token: Non-empty, JWT format (rough check)
 */
export const verifyTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 10 })
    .withMessage('Invalid token format'),
];

/**
 * CREATE POST VALIDATION
 * 
 * - Caption: 0-2000 chars, sanitized (XSS prevention)
 * - MediaUrls: Array of URLs, max 5 items
 * - Mentions: Array of user IDs, max 20 mentions
 */
export const createPostValidation = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Caption must be less than 2000 characters')
    .escape()
    .withMessage('Caption contains invalid characters'),

  body('mediaUrls')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 media URLs allowed')
    .custom((urls: any) => {
      if (!Array.isArray(urls)) {
        throw new Error('mediaUrls must be an array');
      }
      for (const url of urls) {
        if (!isValidUrl(url)) {
          throw new Error(`Invalid URL: ${url}`);
        }
      }
      return true;
    }),

  body('mentions')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 mentions allowed')
    .custom((mentions: any) => {
      if (!Array.isArray(mentions)) {
        throw new Error('mentions must be an array');
      }
      for (const mention of mentions) {
        if (!/^user_[a-zA-Z0-9]+$/.test(mention)) {
          throw new Error(`Invalid user ID format: ${mention}`);
        }
      }
      return true;
    }),
];

/**
 * CREATE COMMENT VALIDATION
 * 
 * - Text: 1-500 chars, sanitized (XSS prevention)
 */
export const createCommentValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be 1-500 characters')
    .escape()
    .withMessage('Comment contains invalid characters'),

  param('postId')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid post ID format'),
];

/**
 * UPDATE PROFILE VALIDATION
 * 
 * - DisplayName: 1-100 chars, sanitized
 * - Bio: 0-500 chars, sanitized
 * - Avatar: Valid URL
 */
export const updateProfileValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be 1-100 characters')
    .escape()
    .withMessage('Display name contains invalid characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
    .escape()
    .withMessage('Bio contains invalid characters'),

  body('avatar')
    .optional()
    .custom((value: any) => {
      if (value && !isValidUrl(value)) {
        throw new Error('Invalid avatar URL');
      }
      return true;
    }),
];

/**
 * PARAMETER VALIDATION FOR DYNAMIC ROUTES
 * 
 * - userId/postId: Alphanumeric with underscores and hyphens only
 * Prevents injection attacks
 */
export const userIdParamValidation = [
  param('userId')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid user ID format'),
];

export const postIdParamValidation = [
  param('postId')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid post ID format'),
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate URL format
 * Prevents malicious URLs in media uploads
 */
function isValidUrl(url: string): boolean {
  try {
    // Must be valid URL
    new URL(url);
    // Must be HTTPS for security
    return url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Handle validation errors
 * 
 * Collects all validation errors and returns them in a consistent format
 * This middleware should be called after validators
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: errors.array().map((err: any) => ({
          field: err.param,
          message: err.msg,
          value: err.value, // Sanitized value
        })),
      },
    });
  }

  next();
};

/**
 * SQL Injection Prevention
 * 
 * ⚠️ IMPORTANT: Always use parameterized queries!
 * 
 * ❌ BAD (vulnerable to SQL injection):
 * const query = `SELECT * FROM users WHERE email = '${email}'`;
 * 
 * ✅ GOOD (safe with parameterized queries):
 * const query = 'SELECT * FROM users WHERE email = $1';
 * client.query(query, [email]);
 * 
 * Example with Supabase (PostgreSQL):
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*')
 *   .eq('email', sanitizedEmail);
 * 
 * Example with pg library:
 * const result = await client.query(
 *   'SELECT * FROM users WHERE email = $1',
 *   [email] // Parameters passed separately
 * );
 * 
 * Never concatenate user input into SQL strings!
 */

// ============================================================
// SECURITY NOTES
// ============================================================

/**
 * XSS Prevention via Sanitization
 * 
 * - .escape() removes HTML special characters
 * - Converts <, >, &, " to &lt;, &gt;, &amp;, &quot;
 * - Prevents stored XSS attacks
 * 
 * Example:
 * Input:  <script>alert('xss')</script>
 * Output: &lt;script&gt;alert('xss')&lt;/script&gt;
 * 
 * When displayed in HTML, it shows the literal text instead of executing
 */

/**
 * Email Validation & Normalization
 * 
 * - .isEmail() validates format (RFC 5322)
 * - .normalizeEmail() converts to lowercase, removes dots
 * - Example: User.Name+tag@EXAMPLE.COM → user.name+tag@example.com
 * 
 * Prevents duplicate accounts (user@example.com vs USER@example.com)
 */

/**
 * Password Requirements
 * 
 * Minimum 12 characters enforced:
 * - 8 chars: Common for legacy systems, too weak for modern threats
 * - 12 chars: NIST recommends minimum 8, but 12+ provides safety margin
 * - 16 chars: Even stronger, recommended for high-security accounts
 * 
 * Mixed character requirements:
 * - Uppercase: Adds 26 possible characters per position
 * - Lowercase: Adds 26 more
 * - Numbers: Adds 10 more
 * - Special: Adds 30+ more
 * 
 * Together: Increases password entropy significantly
 * Example: 12 chars with all types ≈ 2^80 possible combinations
 * 
 * Time to brute force:
 * - 8 char simple: Hours on modern GPU
 * - 12 char mixed: Years on modern GPU
 */

/**
 * Rate Limiting + Validation
 * 
 * Layered defense:
 * 1. Rate limiting stops bulk attacks (express-rate-limit)
 * 2. Input validation stops bad data (express-validator)
 * 3. Sanitization stops code injection (escape, etc)
 * 4. Parameterized queries stop SQL injection
 * 
 * Together they make a secure API
 */

export {};
