/**
 * RATE LIMITING CONFIGURATION
 * 
 * Comprehensive rate limiting strategy for Vairo API
 * Protects against brute force and abuse while maintaining UX
 */

// ============================================================
// RATE LIMIT TIERS
// ============================================================

/**
 * TIER 1: AUTHENTICATION ENDPOINTS
 * 
 * Login attempts: 5 per minute per IP
 * - Prevents brute force attacks
 * - Window: 1 minute
 * - Max requests: 5
 * - Response: 429 Too Many Requests
 * 
 * Registration: 3 per hour per IP
 * - Prevents account enumeration
 * - Window: 60 minutes
 * - Max requests: 3
 * - Response: 429 Too Many Requests
 * 
 * Password reset: 5 per hour per email
 * - Prevents account takeover
 * - Window: 60 minutes
 * - Max requests: 5
 * - Response: 429 Too Many Requests
 * 
 * Use Case:
 * - Attackers trying 1000s of passwords: Blocked after 5 attempts
 * - Multiple registration bots: Blocked after 3 accounts
 * - Password reset abuse: Blocked after 5 requests
 */

/**
 * TIER 2: USER CONTENT ENDPOINTS
 * 
 * Create post: 20 per minute per user
 * - Allows normal user activity
 * - Content creators won't be impacted
 * - Window: 1 minute
 * - Max requests: 20
 * - Response: 429 Too Many Requests
 * 
 * Comment on post: 50 per minute per user
 * - Allows rapid conversation
 * - Window: 1 minute
 * - Max requests: 50
 * - Response: 429 Too Many Requests
 * 
 * Like/unlike: 100 per minute per user
 * - High frequency action (rapid clicking)
 * - Window: 1 minute
 * - Max requests: 100
 * - Response: 429 Too Many Requests
 * 
 * Use Case:
 * - Normal users post 1-5 items per minute
 * - Scripted spam: Would hit 20 quickly
 * - API abuse: Would be immediately blocked
 */

/**
 * TIER 3: READ ENDPOINTS (No limiting)
 * 
 * Search: No limit (fast, no side effects)
 * Feed: No limit (passive reading)
 * Profile: No limit (passive reading)
 * 
 * Use Case:
 * - Users can read freely
 * - Bots flagged by pattern detection instead
 */

/**
 * TIER 4: INTERNAL SERVICES
 * 
 * Exempt from all rate limiting:
 * - Admin dashboard (internal)
 * - Monitoring endpoints
 * - Health checks
 * - Analytics collection
 * 
 * Use Case:
 * - Internal services not affected
 * - Monitoring always responsive
 * - No service-to-service delays
 */

// ============================================================
// CONFIGURATION STRATEGY
// ============================================================

/**
 * REDIS VS MEMORY STORE:
 * 
 * Development:
 * - Use memory store (simpler, no Redis needed)
 * - Resets on server restart (fine for dev)
 * 
 * Production:
 * - Use Redis (persists across restarts)
 * - Distributed rate limiting (multiple servers)
 * - Accurate counts across instances
 * 
 * Store Type Selection:
 * - Memory: Single server, <10k concurrent users
 * - Redis: Distributed, >10k concurrent users
 */

/**
 * KEY PATTERNS:
 * 
 * IP-based (login, registration):
 * - Key: "rl:login:<ip_address>"
 * - Example: "rl:login:192.168.1.100"
 * 
 * User-based (content creation):
 * - Key: "rl:post:<user_id>"
 * - Example: "rl:post:user_12345"
 * 
 * Email-based (password reset):
 * - Key: "rl:reset:<email_hash>"
 * - Example: "rl:reset:abc123def456"
 * 
 * Header-based (API keys):
 * - Key: "rl:api:<api_key>"
 * - Example: "rl:api:sk_live_abc123"
 */

/**
 * RESPONSE HANDLING:
 * 
 * When limit exceeded:
 * - Status: 429 Too Many Requests
 * - Body: JSON with retry information
 * - Headers: Retry-After, RateLimit-*
 * 
 * Example Response:
 * {
 *   "status": "error",
 *   "message": "Too many login attempts. Try again in 60 seconds.",
 *   "retryAfter": 60,
 *   "limit": 5,
 *   "remaining": 0,
 *   "resetTime": 1645000000000
 * }
 */

/**
 * SKIP CONDITIONS:
 * 
 * Skip rate limiting for:
 * - Internal IP addresses (127.0.0.1, ::1)
 * - Trusted admin IPs (can be configured)
 * - Health check endpoints
 * - Monitoring endpoints
 * - Admin dashboard requests
 * - Load balancer health checks
 */

/**
 * CUSTOM KEY GENERATION:
 * 
 * For login endpoint:
 * - Use IP address as key
 * - Combine IP + User-Agent for more accuracy
 * - Example: "rl:login:192.168.1.100:Chrome-Win10"
 * 
 * For user endpoints:
 * - Use authenticated user ID
 * - Falls back to IP if not authenticated
 * - Example: "rl:post:user_12345"
 * 
 * For registration:
 * - Use IP address (user doesn't exist yet)
 * - Also check email (prevent enumeration)
 * - Example: "rl:register:192.168.1.100"
 */

// ============================================================
// IMPLEMENTATION EXAMPLES
// ============================================================

/**
 * BASIC SETUP:
 * 
 * import rateLimit from 'express-rate-limit';
 * import { RedisStore } from 'rate-limit-redis';
 * import redis from 'redis';
 * 
 * // Create Redis client
 * const redisClient = redis.createClient();
 * 
 * // Create rate limiter
 * const loginLimiter = rateLimit({
 *   store: new RedisStore({
 *     client: redisClient,
 *     prefix: 'rl:login:'
 *   }),
 *   windowMs: 60 * 1000,        // 1 minute
 *   max: 5,                     // 5 requests
 *   message: 'Too many login attempts',
 *   standardHeaders: true,      // Return RateLimit-* headers
 *   legacyHeaders: false,       // Disable X-RateLimit-* headers
 *   keyGenerator: (req, res) => req.ip,
 *   handler: (req, res) => {
 *     res.status(429).json({
 *       status: 'error',
 *       message: 'Too many login attempts. Try again in 1 minute.',
 *       retryAfter: 60
 *     });
 *   }
 * });
 * 
 * // Apply to route
 * app.post('/api/auth/login', loginLimiter, loginHandler);
 */

/**
 * MEMORY STORE (DEVELOPMENT):
 * 
 * import rateLimit from 'express-rate-limit';
 * 
 * const loginLimiter = rateLimit({
 *   windowMs: 60 * 1000,
 *   max: 5,
 *   message: 'Too many login attempts',
 *   standardHeaders: true,
 *   legacyHeaders: false
 * });
 * 
 * // No store specified = uses memory
 * // Simple, works offline
 * // Resets on restart (fine for dev)
 */

/**
 * REDIS STORE (PRODUCTION):
 * 
 * npm install rate-limit-redis redis
 * 
 * import rateLimit from 'express-rate-limit';
 * import { RedisStore } from 'rate-limit-redis';
 * import { createClient } from 'redis';
 * 
 * const redisClient = createClient();
 * 
 * const loginLimiter = rateLimit({
 *   store: new RedisStore({
 *     client: redisClient,
 *     prefix: 'rl:login:'
 *   }),
 *   windowMs: 60 * 1000,
 *   max: 5
 * });
 */

// ============================================================
// ADVANCED PATTERNS
// ============================================================

/**
 * TIERED LIMITS (Sliding Window):
 * 
 * Different limits at different times:
 * - 5 attempts in 1 minute (strict)
 * - 20 attempts in 10 minutes (lenient)
 * - 50 attempts in 1 hour (very lenient)
 * 
 * Implementation:
 * - Check 1-min window first
 * - If passed, check 10-min window
 * - If passed, check 1-hour window
 * - Fail if any exceeded
 * 
 * Benefit:
 * - Catches spam quickly
 * - Allows legitimate recovery
 * - More nuanced than single limit
 */

/**
 * ADAPTIVE LIMITING:
 * 
 * Adjust limits based on:
 * - Time of day (looser during peak hours)
 * - Account age (stricter for new accounts)
 * - Account reputation (looser for trusted)
 * - Geographic location (stricter for suspicious)
 * 
 * Example:
 * - New account (0-7 days): 3 posts per minute
 * - Established account (>30 days): 20 posts per minute
 * - Premium account: 100 posts per minute
 */

/**
 * GRACEFUL DEGRADATION:
 * 
 * If Redis down:
 * - Fall back to memory store
 * - Continue limiting (no spam burst)
 * - Log Redis error
 * - Alert ops team
 * 
 * If rate limit fails:
 * - Don't block request
 * - Log error
 * - Allow request through
 * - Monitor fallback rate
 */

/**
 * IP DETECTION (Behind Proxy):
 * 
 * Trust proxy setting:
 * app.set('trust proxy', 1);  // Trust 1 proxy level
 * 
 * Headers checked (in order):
 * 1. X-Forwarded-For (most common)
 * 2. CF-Connecting-IP (Cloudflare)
 * 3. X-Real-IP (Nginx)
 * 4. Client IP (fallback)
 * 
 * Important: Configure correctly or limits fail!
 */

// ============================================================
// MONITORING & ALERTING
// ============================================================

/**
 * METRICS TO TRACK:
 * 
 * Rate Limit Hits:
 * - How often limits are hit
 * - Which endpoints are limited
 * - Which IPs/users are limited
 * - Trending patterns
 * 
 * False Positives:
 * - Legitimate users getting blocked
 * - Reduce limits if high false positive rate
 * - Monitor error logs
 * 
 * Real Attacks:
 * - Spike in 429 responses
 * - Multiple IPs from same country
 * - Pattern of credential guessing
 * - Coordinated account creation
 */

/**
 * ALERT CONDITIONS:
 * 
 * Alert if:
 * - >100 rate limit hits in 5 minutes
 * - Same IP hits limit >10 times
 * - Different IPs same subnet (botnet)
 * - Login endpoint 429 rate >10%
 * - Registration endpoint exhausted
 * 
 * Actions:
 * - Increase Redis memory
 * - Tighten limits temporarily
 * - Block subnets (firewall)
 * - Review access logs
 */

/**
 * LOGGING:
 * 
 * Log when limit hit:
 * {
 *   timestamp: '2026-02-17T10:30:00Z',
 *   endpoint: '/api/auth/login',
 *   ip: '192.168.1.100',
 *   userId: 'user_12345' (if auth),
 *   attempts: 6,
 *   limit: 5,
 *   windowMs: 60000,
 *   userAgent: 'Mozilla/5.0...'
 * }
 * 
 * Aggregate and trend:
 * - By endpoint
 * - By IP address
 * - By user ID
 * - By time of day
 */

// ============================================================
// TESTING RATE LIMITS
// ============================================================

/**
 * TEST SCENARIO 1: Login Brute Force
 * 
 * Test: Send 6 requests rapidly
 * Expected: First 5 succeed, 6th returns 429
 * 
 * curl -X POST http://localhost:3001/api/auth/login \
 *   -d '{"email":"test@example.com","password":"wrong"}' \
 *   -H "Content-Type: application/json"
 * 
 * (repeat 6 times)
 */

/**
 * TEST SCENARIO 2: Registration Spam
 * 
 * Test: Send 4 requests in 1 hour
 * Expected: First 3 succeed, 4th returns 429
 * 
 * curl -X POST http://localhost:3001/api/auth/register \
 *   -d '{"email":"user@example.com","password":"password"}' \
 *   -H "Content-Type: application/json"
 * 
 * (repeat 4 times with different emails)
 */

/**
 * TEST SCENARIO 3: Content Spam
 * 
 * Test: Send 21 POST requests in 1 minute
 * Expected: First 20 succeed, remaining return 429
 * 
 * curl -X POST http://localhost:3001/api/posts \
 *   -d '{"content":"test"}' \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer <token>"
 * 
 * (repeat 21 times with delays)
 */

/**
 * TEST SCENARIO 4: Different IPs
 * 
 * Test: Send requests from different IPs
 * Expected: Each IP has separate limit
 * 
 * curl -X POST http://localhost:3001/api/auth/login \
 *   -H "X-Forwarded-For: 192.168.1.100"
 * 
 * curl -X POST http://localhost:3001/api/auth/login \
 *   -H "X-Forwarded-For: 192.168.1.101"
 * 
 * (each IP gets 5 attempts)
 */

/**
 * TEST SCENARIO 5: Whitelist (Skip Limits)
 * 
 * Test: Internal IP should not be limited
 * Expected: 127.0.0.1 gets unlimited requests
 * 
 * curl -X POST http://localhost:3001/api/auth/login \
 *   -H "X-Forwarded-For: 127.0.0.1"
 * 
 * (send 100+ requests, all succeed)
 */

// ============================================================
// COMPLIANCE & LEGAL
// ============================================================

/**
 * GDPR CONSIDERATIONS:
 * 
 * Rate limit logs contain:
 * - IP addresses (PII in some jurisdictions)
 * - User IDs (PII)
 * - Timestamps
 * - User-Agent (fingerprinting)
 * 
 * Recommendations:
 * - Hash IP addresses in logs
 * - Anonymize after 90 days
 * - Have privacy policy about rate limiting
 * - Allow users to request their data
 * - Document data retention policy
 */

/**
 * ACCESSIBILITY CONSIDERATIONS:
 * 
 * Rate limited users:
 * - Must receive clear error message
 * - Must know when limit resets
 * - Must not be permanently locked out
 * - Should have recovery path (contact support)
 * 
 * Best Practice:
 * - Clear error message: "Try again in 60 seconds"
 * - Retry-After header
 * - Support contact form
 * - Whitelist option for legitimate users
 */

export {};
