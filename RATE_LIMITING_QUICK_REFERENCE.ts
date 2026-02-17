/**
 * RATE LIMITING - QUICK REFERENCE CARD
 * 
 * Copy these snippets to quickly integrate rate limiting
 */

// ============================================================
// 60-SECOND INTEGRATION
// ============================================================

/**
 * STEP 1: Import limiters (1 line)
 * 
 * import { rateLimiters } from '@/middleware/rateLimiters';
 */

/**
 * STEP 2: Apply to endpoints (3-4 lines per route)
 * 
 * // Login
 * app.post('/api/auth/login', rateLimiters.login, loginHandler);
 * 
 * // Register
 * app.post('/api/auth/register', rateLimiters.register, registerHandler);
 * 
 * // Create post
 * app.post('/api/posts',
 *   authMiddleware,
 *   rateLimiters.createPost,
 *   postHandler
 * );
 */

/**
 * STEP 3: Configure proxy (1 line)
 * 
 * app.set('trust proxy', 1);  // IMPORTANT!
 */

/**
 * STEP 4: Set environment (optional)
 * 
 * NODE_ENV=production
 * REDIS_URL=redis://localhost:6379
 */

/**
 * DONE! Rate limiting is now active ✅
 */

// ============================================================
// WHAT EACH LIMITER DOES
// ============================================================

/**
 * rateLimiters.login
 * - 5 attempts per minute per IP
 * - Stops brute force attacks
 * 
 * Usage:
 * app.post('/api/auth/login', rateLimiters.login, handler);
 */

/**
 * rateLimiters.register
 * - 3 accounts per hour per IP
 * - Stops bulk registration bots
 * 
 * Usage:
 * app.post('/api/auth/register', rateLimiters.register, handler);
 */

/**
 * rateLimiters.passwordReset
 * - 5 requests per hour per email
 * - Stops password reset abuse
 * 
 * Usage:
 * app.post('/api/auth/password-reset',
 *   rateLimiters.passwordReset,
 *   handler
 * );
 */

/**
 * rateLimiters.verifyToken
 * - 10 requests per minute per IP
 * - Stops token enumeration
 * 
 * Usage:
 * app.get('/api/auth/verify',
 *   rateLimiters.verifyToken,
 *   handler
 * );
 */

/**
 * rateLimiters.createPost
 * - 20 posts per minute per user
 * - Allows normal users, stops spam
 * 
 * Usage:
 * app.post('/api/posts',
 *   authMiddleware,
 *   rateLimiters.createPost,
 *   handler
 * );
 */

/**
 * rateLimiters.createComment
 * - 50 comments per minute per user
 * - Allows conversation, stops spam
 * 
 * Usage:
 * app.post('/api/posts/:id/comments',
 *   authMiddleware,
 *   rateLimiters.createComment,
 *   handler
 * );
 */

/**
 * rateLimiters.like
 * - 100 likes per minute per user
 * - Allows rapid clicking
 * 
 * Usage:
 * app.post('/api/posts/:id/like',
 *   authMiddleware,
 *   rateLimiters.like,
 *   handler
 * );
 */

/**
 * rateLimiters.updateProfile
 * - 20 updates per hour per user
 * - Prevents spam profile changes
 * 
 * Usage:
 * app.patch('/api/users/me',
 *   authMiddleware,
 *   rateLimiters.updateProfile,
 *   handler
 * );
 */

/**
 * rateLimiters.global
 * - 1000 requests per hour per IP
 * - Catches everything else
 * 
 * Usage (apply to all routes):
 * app.use(rateLimiters.global);
 */

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * WHAT THE USER SEES WHEN RATE LIMITED
 * 
 * HTTP 429 Too Many Requests
 * 
 * {
 *   "status": "error",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "message": "Too many login attempts. Please try again later.",
 *   "retryAfter": 60,  // Wait 60 seconds
 *   "limit": "5",
 *   "remaining": "0",
 *   "reset": "1645084200000"
 * }
 */

/**
 * FRONTEND HANDLING (JavaScript)
 * 
 * async function loginWithErrorHandling(email, password) {
 *   try {
 *     const response = await fetch('/api/auth/login', {
 *       method: 'POST',
 *       body: JSON.stringify({ email, password })
 *     });
 * 
 *     if (response.status === 429) {
 *       const error = await response.json();
 *       showError(
 *         `Too many attempts. Try again in ${error.retryAfter}s`
 *       );
 *       return null;
 *     }
 * 
 *     if (!response.ok) {
 *       showError('Invalid credentials');
 *       return null;
 *     }
 * 
 *     return await response.json();
 *   } catch (error) {
 *     showError('Network error');
 *     return null;
 *   }
 * }
 */

// ============================================================
// TESTING
// ============================================================

/**
 * QUICK TEST (5 rapid login attempts)
 * 
 * for i in {1..6}; do
 *   curl -X POST http://localhost:3001/api/auth/login \
 *     -d '{"email":"test@example.com","password":"wrong"}' \
 *     -H "Content-Type: application/json" \
 *     -w "Status: %{http_code}\n"
 *   sleep 0.5
 * done
 * 
 * Expected Output:
 * Status: 401 ✓
 * Status: 401 ✓
 * Status: 401 ✓
 * Status: 401 ✓
 * Status: 401 ✓
 * Status: 429 ✓ (RATE LIMITED!)
 */

/**
 * TEST POST CREATION (20 per minute)
 * 
 * First get token:
 * TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
 *   -d '{"email":"test@example.com","password":"correct"}' \
 *   -H "Content-Type: application/json" | jq -r '.accessToken')
 * 
 * Then make 22 post requests:
 * for i in {1..22}; do
 *   curl -X POST http://localhost:3001/api/posts \
 *     -d "{\"content\":\"Post $i\"}" \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer $TOKEN" \
 *     -w "Status: %{http_code}\n"
 *   sleep 0.1
 * done
 * 
 * Expected: First 20 are 201 Created, #21-22 are 429
 */

// ============================================================
// COMMON ISSUES & FIXES
// ============================================================

/**
 * ISSUE: Getting 127.0.0.1 as IP (behind proxy)
 * 
 * FIX: Add this line to Express app
 * app.set('trust proxy', 1);
 * 
 * This tells Express to trust X-Forwarded-For header
 */

/**
 * ISSUE: Rate limiter not working
 * 
 * CHECKLIST:
 * [ ] express-rate-limit installed? npm list express-rate-limit
 * [ ] Middleware applied to route? Check order
 * [ ] trust proxy set? app.set('trust proxy', 1)
 * [ ] Correct limiter used? checkconfig
 * [ ] Testing localhost? Localhost is whitelisted
 * 
 * FIX: Test from different IP or use X-Forwarded-For header
 */

/**
 * ISSUE: Limits too strict (users complaining)
 * 
 * FIX: Increase limits temporarily
 * 
 * Current: createPostLimiter (20 per minute)
 * Change to: max: 50 in middleware/rateLimiters.ts
 * 
 * Warning: Adjust carefully, don't make too loose
 */

/**
 * ISSUE: Production performance (rate limiter slow)
 * 
 * FIX: Use Redis instead of memory store
 * 
 * 1. Install: npm install redis rate-limit-redis
 * 2. Set env: REDIS_URL=redis://localhost:6379
 * 3. Middleware auto-uses Redis if available
 * 
 * This distributes limits across servers
 */

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

/**
 * OPTIONAL ENV VARIABLES
 * 
 * # Rate limiting prefix (for Redis keys)
 * RATE_LIMIT_PREFIX=rl:
 * 
 * # IPs to skip rate limiting (comma-separated)
 * RATE_LIMIT_WHITELIST=127.0.0.1,localhost,192.168.1.1
 * 
 * # Redis URL (if using Redis backend)
 * REDIS_URL=redis://localhost:6379
 * 
 * # Node environment
 * NODE_ENV=production
 */

// ============================================================
// FILE LOCATIONS
// ============================================================

/**
 * RATE LIMITING FILES CREATED:
 * 
 * ✅ middleware/rateLimiters.ts (470 lines - MAIN FILE)
 *    - All 7 limiters configured
 *    - Ready to copy and use
 * 
 * 📚 utils/RATE_LIMITING_CONFIG.ts (reference)
 * 📚 RATE_LIMITING_IMPLEMENTATION_EXAMPLES.ts (reference)
 * 📚 RATE_LIMITING_MONITORING_TESTING.ts (reference)
 * 📚 RATE_LIMITING_INSTALLATION_GUIDE.ts (reference)
 * 📚 RATE_LIMITING_IMPLEMENTATION_SUMMARY.ts (reference)
 * 📚 RATE_LIMITING_QUICK_REFERENCE.ts (this file)
 */

// ============================================================
// DEPLOY CHECKLIST
// ============================================================

/**
 * BEFORE DEPLOYING TO PRODUCTION:
 * 
 * [ ] Read RATE_LIMITING_INSTALLATION_GUIDE.ts
 * [ ] Copy middleware/rateLimiters.ts
 * [ ] npm install express-rate-limit
 * [ ] Apply to routes (see examples above)
 * [ ] Set app.set('trust proxy', 1)
 * [ ] Test locally with scripts
 * [ ] Configure .env variables
 * [ ] Set up monitoring
 * [ ] Deploy
 * [ ] Watch for 429 errors
 * [ ] Adjust limits if needed
 * [ ] Monitor for attacks
 */

// ============================================================
// PRODUCTION SETTINGS
// ============================================================

/**
 * .env PRODUCTION FILE EXAMPLE:
 * 
 * NODE_ENV=production
 * 
 * # Rate limiting
 * RATE_LIMIT_PREFIX=rl:
 * RATE_LIMIT_WHITELIST=127.0.0.1
 * 
 * # Redis (required for production)
 * REDIS_URL=redis://:password@redis-host:6379
 * 
 * # Other settings
 * HTTPS=true
 * PORT=443
 */

/**
 * EXPRESS CONFIG:
 * 
 * app.set('trust proxy', 1);                    // Trust proxy
 * app.use(express.json());                      // Parse JSON
 * app.use(cookieParser());                      // Parse cookies
 * app.use(rateLimiters.global);                 // Global limit
 * 
 * // Auth routes (specific limits)
 * app.post('/api/auth/login', rateLimiters.login, loginHandler);
 * app.post('/api/auth/register', rateLimiters.register, registerHandler);
 * 
 * // Content routes (user-specific limits)
 * app.post('/api/posts',
 *   authMiddleware,
 *   rateLimiters.createPost,
 *   postHandler
 * );
 */

// ============================================================
// SUPPORT
// ============================================================

/**
 * NEED HELP?
 * 
 * 1. Check RATE_LIMITING_INSTALLATION_GUIDE.ts
 *    - Step-by-step setup
 *    - Environment configuration
 *    - Proxy setup
 * 
 * 2. See RATE_LIMITING_IMPLEMENTATION_EXAMPLES.ts
 *    - Complete route examples
 *    - Full app setup
 *    - Error handling
 * 
 * 3. Run RATE_LIMITING_MONITORING_TESTING.ts scripts
 *    - Test scenarios
 *    - Verify it works
 *    - Troubleshooting
 * 
 * 4. Review code comments in middleware/rateLimiters.ts
 *    - Detailed documentation
 *    - Configuration options
 *    - Parameter explanations
 */

/**
 * COMMON QUESTIONS:
 * 
 * Q: Do I need Redis?
 * A: No for single server, yes for multiple servers
 * 
 * Q: Will this affect my API performance?
 * A: Negligible (<5ms), network is bottleneck
 * 
 * Q: Can I customize limits?
 * A: Yes, edit max and windowMs in middleware/rateLimiters.ts
 * 
 * Q: What if I hit the limit by mistake?
 * A: Wait for window to reset (shown in response)
 * 
 * Q: Does this prevent all attacks?
 * A: No, it's one layer. Add firewall rules too.
 */

export {};
