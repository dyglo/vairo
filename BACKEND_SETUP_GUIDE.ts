/**
 * BACKEND SETUP & INTEGRATION GUIDE
 * 
 * ✅ Express server with rate limiting ready to run
 * ✅ All API routes protected with specific rate limiters
 * ✅ Production-ready configuration
 * ✅ Easy to test and deploy
 * 
 * Date: February 17, 2026
 */

// ============================================================
// QUICK START (5 MINUTES)
// ============================================================

/**
 * 1. Install Dependencies
 *    npm install
 * 
 *    This installs all packages including:
 *    - express (HTTP server)
 *    - express-rate-limit (rate limiting middleware)
 *    - rate-limit-redis (optional Redis store)
 *    - cors (cross-origin requests)
 *    - nodemon (auto-reload in dev)
 *    - ts-node (run TypeScript directly)
 * 
 * 2. Set Up Environment
 *    Copy .env.example to .env (see section below)
 * 
 * 3. Start Development Server
 *    npm run server:dev
 * 
 *    Expected output:
 *    ╔════════════════════════════════════════════╗
 *    ║        VAIRO API SERVER STARTED            ║
 *    ╚════════════════════════════════════════════╝
 *    
 *    🚀 Server: http://localhost:3000
 *    🔧 Environment: development
 *    🛡️  Rate Limiting: ✅ ENABLED
 * 
 * 4. Test Server
 *    curl http://localhost:3000/health
 *    
 *    Expected response:
 *    {
 *      "status": "ok",
 *      "timestamp": "2026-02-17T...",
 *      "uptime": 2.45
 *    }
 * 
 * 5. Done! 🚀 Server is running with rate limiting
 */

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

/**
 * Create .env file in root directory with:
 * 
 * NODE_ENV=development
 * PORT=3000
 * DATABASE_URL=
 * JWT_SECRET=your-super-secret-key-min-32-chars-long
 * CORS_ORIGIN=http://localhost:8081
 * REDIS_URL=redis://localhost:6379
 * RATE_LIMIT_WHITELIST=127.0.0.1,::1
 * 
 * ─────────────────────────────────────────
 * 
 * NODE_ENV
 *   - development  (memory store for rate limiting)
 *   - production   (requires Redis for distributed limiting)
 * 
 * PORT
 *   - Default: 3000
 *   - Change if port is in use
 * 
 * DATABASE_URL
 *   - Supabase PostgreSQL URL
 *   - Format: postgresql://user:pass@host:port/database
 * 
 * JWT_SECRET
 *   - Use: openssl rand -base64 32
 *   - MUST be at least 32 characters
 *   - NEVER commit to git
 * 
 * CORS_ORIGIN
 *   - Your frontend URL
 *   - Development: http://localhost:8081
 *   - Production: https://yourdomain.com
 * 
 * REDIS_URL
 *   - Optional (dev uses memory store)
 *   - Format: redis://[:password@]host[:port]
 *   - Development: redis://localhost:6379
 *   - Production: Use cloud Redis (AWS, Heroku, etc)
 * 
 * RATE_LIMIT_WHITELIST
 *   - Comma-separated IPs (no rate limiting)
 *   - Format: 127.0.0.1,192.168.1.1,::1
 */

// ============================================================
// NPM SCRIPTS
// ============================================================

/**
 * npm run server:dev
 *   - Start server in development mode
 *   - Auto-reloads on file changes (nodemon)
 *   - Uses memory store for rate limiting
 *   - Includes request logging
 * 
 * npm run server
 *   - Start server
 *   - Uses NODE_ENV from environment
 *   - Requires ts-node
 * 
 * npm run server:prod
 *   - Start server in production mode
 *   - NODE_ENV=production
 *   - Requires Redis for distributed limiting
 *   - No auto-reload
 * 
 * npm run typecheck
 *   - Verify TypeScript (0 errors expected)
 * 
 * npm run dev
 *   - Start Expo frontend (separate from server)
 *   - Runs on http://localhost:8081 (default)
 */

// ============================================================
// FILE STRUCTURE
// ============================================================

/**
 * server.ts                          ← Main server file (Express)
 * middleware/
 *   rateLimiters.ts                  ← Rate limiting middleware
 * utils/
 *   RATE_LIMITING_CONFIG.ts          ← Configuration reference
 * 
 * Files created this session:
 * ✅ server.ts (Express app with rate limiters)
 * ✅ package.json (updated with backend dependencies)
 * 
 * Rate limiting files (previous session):
 * ✅ middleware/rateLimiters.ts (7 pre-configured limiters)
 * ✅ RATE_LIMITING_*.ts (6 comprehensive guides)
 */

// ============================================================
// PROTECTED ROUTES
// ============================================================

/**
 * TIER 1: AUTHENTICATION (5 per minute / IP)
 * 
 * POST /api/auth/login
 *   Rate: 5 per minute per IP
 *   Body: { email, password }
 *   Response: { user, token, refreshToken }
 * 
 * POST /api/auth/register
 *   Rate: 3 per hour per IP
 *   Body: { email, password, displayName }
 *   Response: { id, email, displayName }
 * 
 * POST /api/auth/password-reset
 *   Rate: 5 per hour per email
 *   Body: { email }
 *   Response: { message }
 * 
 * POST /api/auth/verify-token
 *   Rate: 10 per minute per IP
 *   Body: { token }
 *   Response: { valid, user }
 * 
 * ─────────────────────────────────────────
 * TIER 2: CONTENT (20-100 per minute / user)
 * 
 * POST /api/posts
 *   Rate: 20 per minute per user
 *   Auth: Required (token)
 *   Body: { caption, mediaUrls, mentions }
 *   Response: { id, userId, caption, createdAt }
 * 
 * POST /api/posts/:postId/comments
 *   Rate: 50 per minute per user
 *   Auth: Required
 *   Body: { text }
 *   Response: { id, postId, userId, text, createdAt }
 * 
 * POST /api/posts/:postId/like
 *   Rate: 100 per minute per user
 *   Auth: Required
 *   Response: { liked, likeCount }
 * 
 * PATCH /api/users/me
 *   Rate: 20 per hour per user
 *   Auth: Required
 *   Body: { displayName, bio, avatar }
 *   Response: { id, displayName, bio, avatar }
 * 
 * GET /api/users/:userId
 *   Rate: No specific limit (global only)
 *   Auth: Not required
 *   Response: { id, displayName, bio, avatar, followers, following }
 * 
 * ─────────────────────────────────────────
 * TIER 3: GLOBAL FALLBACK
 * 
 * * (all other routes)
 *   Rate: 1000 per hour per IP
 *   Purpose: Safety net for unmeasured endpoints
 */

// ============================================================
// RATE LIMIT RESPONSES
// ============================================================

/**
 * When rate limited, client receives:
 * 
 * HTTP 429 Too Many Requests
 * 
 * {
 *   "status": "error",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "message": "Too many login attempts. Please try again later.",
 *   "retryAfter": 60,
 *   "limit": "5",
 *   "remaining": "0",
 *   "reset": "1645084260000"
 * }
 * 
 * Headers:
 * RateLimit-Limit: 5
 * RateLimit-Remaining: 0
 * RateLimit-Reset: 1645084260
 * Retry-After: 60
 * 
 * Frontend should:
 * 1. Show error to user
 * 2. Display retry-after time
 * 3. Disable button until reset time
 * 4. Log event for analytics
 */

// ============================================================
// TESTING RATE LIMITS
// ============================================================

/**
 * Test Configuration:
 * - Server: http://localhost:3000
 * - Environment: development (memory store)
 * - Initial test: No Docker/Redis needed
 * 
 * ─────────────────────────────────────────
 * 
 * TEST 1: Login Rate Limiting (5 per minute)
 * 
 * Bash:
 * for i in {1..7}; do
 *   curl -X POST http://localhost:3000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"test@example.com","password":"test"}' \
 *     -w "\n[Request $i] Status: %{http_code}\n"
 *   sleep 0.5
 * done
 * 
 * Expected:
 * - Requests 1-5: HTTP 200 (success)
 * - Requests 6-7: HTTP 429 (rate limited)
 * 
 * ─────────────────────────────────────────
 * 
 * TEST 2: Registration Rate Limiting (3 per hour)
 * 
 * Bash:
 * for i in {1..5}; do
 *   curl -X POST http://localhost:3000/api/auth/register \
 *     -H "Content-Type: application/json" \
 *     -d "{\"email\":\"user$i@example.com\",\"password\":\"pass$i\",\"displayName\":\"User$i\"}" \
 *     -w "\n[Request $i] Status: %{http_code}\n"
 *   sleep 0.5
 * done
 * 
 * Expected:
 * - Requests 1-3: HTTP 201 (created)
 * - Requests 4-5: HTTP 429 (rate limited)
 * 
 * ─────────────────────────────────────────
 * 
 * TEST 3: Post Creation (20 per minute per user)
 * 
 * First authenticate:
 * TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"test@example.com","password":"test"}' | \
 *   jq -r '.data.token')
 * 
 * Then create posts:
 * for i in {1..22}; do
 *   curl -X POST http://localhost:3000/api/posts \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer $TOKEN" \
 *     -d '{"caption":"Test post","mediaUrls":[]}' \
 *     -w "\n[Post $i] Status: %{http_code}\n"
 *   sleep 0.1
 * done
 * 
 * Expected:
 * - Posts 1-20: HTTP 201 (created)
 * - Posts 21-22: HTTP 429 (rate limited)
 * 
 * ─────────────────────────────────────────
 * 
 * TEST 4: Health Check (not rate limited)
 * 
 * for i in {1..100}; do
 *   curl -s http://localhost:3000/health | jq '.status'
 * done
 * 
 * Expected:
 * - All 100: "ok" (health checks bypass rate limiting)
 */

// ============================================================
// FRONTEND INTEGRATION
// ============================================================

/**
 * Your Expo frontend should:
 * 
 * 1. Update API Base URL in apiClient.ts:
 * 
 *    export const API_BASE_URL = 
 *      process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
 * 
 * 2. Handle 429 responses:
 * 
 *    try {
 *      // Make request
 *    } catch (error) {
 *      if (error.response?.status === 429) {
 *        const retryAfter = error.response.data.retryAfter;
 *        // Show "Please wait X seconds" message
 *        // Disable button for X seconds
 *      }
 *    }
 * 
 * 3. Set environment variable in .env:
 * 
 *    EXPO_PUBLIC_API_URL=http://localhost:3000
 * 
 *    For production:
 *    EXPO_PUBLIC_API_URL=https://api.yourdomain.com
 */

// ============================================================
// PRODUCTION DEPLOYMENT
// ============================================================

/**
 * Before deploying to production:
 * 
 * ☐ Install Redis (or use cloud Redis service)
 * ☐ Set REDIS_URL in production environment
 * ☐ Set NODE_ENV=production
 * ☐ Set JWT_SECRET (use strong secret)
 * ☐ Update CORS_ORIGIN to your domain
 * ☐ Set DATABASE_URL to production database
 * ☐ Test rate limiting with load testing tool
 * ☐ Set up monitoring/alerting
 * ☐ Configure cloudflare/reverse proxy if needed
 * 
 * Production Commands:
 * npm run server:prod        (start)
 * npm run typecheck          (verify TS)
 * 
 * Deployment Platforms:
 * 
 * Heroku:
 *   Add Redis: heroku addons:create heroku-redis
 *   Deploy: git push heroku main
 * 
 * AWS:
 *   - EC2 or ECS for server
 *   - ElastiCache for Redis
 *   - API Gateway for proxy
 * 
 * DigitalOcean:
 *   - App Platform for server
 *   - Redis cluster for caching
 * 
 * Google Cloud:
 *   - Cloud Run for server
 *   - Cloud Memorystore for Redis
 */

// ============================================================
// MONITORING & DEBUGGING
// ============================================================

/**
 * Monitor rate limit hits in console:
 * 
 * Every request logs:
 * [2026-02-17T10:30:45.123Z] POST /api/auth/login 200 (45ms)
 * 
 * Rate limit events:
 * [RATE_LIMIT] loginLimiter hit - IP: 127.0.0.1, Limit: 5/min
 * 
 * Verify IP Detection:
 * - Health check endpoint logs the detected IP
 * - Check logs to diagnose proxy issues
 * 
 * Common Issues:
 * 
 * Issue: All requests rate limited immediately
 * → Check: app.set('trust proxy', 1) is before rate limiters
 * → Check: REDIS_URL not set, using memory store
 * 
 * Issue: IP from requests not detected
 * → Check: Proxy headers (X-Forwarded-For, CF-Connecting-IP)
 * → Check: trust proxy setting correct
 * 
 * Issue: Rate limit not working
 * → Check: globalLimiter is last in middleware chain
 * → Check: Specific limiters applied to routes
 * 
 * Debug Mode:
 * Add to server.ts for detailed logging:
 * console.log('Request IP:', req.ip);
 * console.log('Rate limiter applied:', rate limiter name);
 */

// ============================================================
// TROUBLESHOOTING
// ============================================================

/**
 * Problem: npm install fails
 * Solution: 
 *   npm install --verbose
 *   Check Node.js version: node --version (should be 14+)
 * 
 * Problem: server.ts doesn't start
 * Solution:
 *   npm run typecheck    (check for errors)
 *   Check .env file exists and has required vars
 *   Check port 3000 is not in use: lsof -i :3000
 * 
 * Problem: Rate limiting not enforcing
 * Solution:
 *   Check middleware/rateLimiters.ts is imported
 *   Check specific limiter is applied to route
 *   Check globalLimiter is at end of middleware chain
 *   Verify NODE_ENV and storage backend
 * 
 * Problem: CORS errors from frontend
 * Solution:
 *   Update CORS_ORIGIN in .env to match frontend URL
 *   Make sure credentials: true is set
 *   Check Access-Control headers in response
 * 
 * Problem: Database connection fails
 * Solution:
 *   Verify DATABASE_URL is set correctly
 *   Check credentials and network access
 *   Test with: psql <DATABASE_URL>
 */

// ============================================================
// NEXT STEPS
// ============================================================

/**
 * 1. READ THIS FILE
 *    (You're doing it! ✓)
 * 
 * 2. CREATE .env FILE
 *    cp .env.example .env
 *    Edit with your values
 *    (5 minutes)
 * 
 * 3. INSTALL DEPENDENCIES
 *    npm install
 *    (2 minutes, will show progress)
 * 
 * 4. START DEVELOPMENT SERVER
 *    npm run server:dev
 *    (Should see "VAIRO API SERVER STARTED" message)
 * 
 * 5. TEST HEALTH ENDPOINT
 *    curl http://localhost:3000/health
 *    (Should return { status: "ok" })
 * 
 * 6. RUN TEST SCRIPTS
 *    See "TESTING RATE LIMITS" section above
 *    (5-10 minutes to verify everything works)
 * 
 * 7. INTEGRATE WITH FRONTEND
 *    Update apiClient.ts to point to http://localhost:3000
 *    Test login, create post, etc from frontend
 * 
 * 8. DEPLOY TO PRODUCTION
 *    Follow "PRODUCTION DEPLOYMENT" section
 * 
 * TOTAL TIME: 30-45 minutes for complete setup
 */

// ============================================================
// SUPPORT RESOURCES
// ============================================================

/**
 * Files in this repository:
 * 
 * server.ts
 *   - Express app with all routes and rate limiters
 *   - Use as reference for route implementation
 * 
 * middleware/rateLimiters.ts
 *   - Rate limiting middleware (import and apply)
 * 
 * RATE_LIMITING_QUICK_REFERENCE.ts
 *   - Quick reference for rate limiters
 * 
 * RATE_LIMITING_INSTALLATION_GUIDE.ts
 *   - Detailed installation and configuration
 * 
 * RATE_LIMITING_IMPLEMENTATION_EXAMPLES.ts
 *   - Code examples for all endpoints
 * 
 * RATE_LIMITING_MONITORING_TESTING.ts
 *   - Testing scenarios with executable scripts
 * 
 * Documentation:
 * 
 * Express.js: https://expressjs.com/
 * express-rate-limit: https://github.com/nfriedly/express-rate-limit
 * Redis: https://redis.io/
 * 
 * Questions?
 * - Check the documentation files listed above
 * - Review server.ts for route examples
 * - Run test scripts to verify configuration
 */

export {};
