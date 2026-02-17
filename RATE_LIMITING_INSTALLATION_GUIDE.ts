/**
 * RATE LIMITING - INSTALLATION & SETUP GUIDE
 * 
 * Complete guide to install and configure rate limiting
 */

// ============================================================
// INSTALLATION
// ============================================================

/**
 * STEP 1: Install Dependencies
 * 
 * npm install express-rate-limit
 * npm install --save-dev @types/express-rate-limit
 * 
 * Optional (for Redis support):
 * npm install rate-limit-redis redis
 * 
 * Choose based on your needs:
 * - Memory only: express-rate-limit (no Redis)
 * - Production/distributed: add rate-limit-redis + redis
 */

/**
 * VERIFY INSTALLATION:
 * 
 * npm list express-rate-limit
 * 
 * Output should show:
 * └── express-rate-limit@6.7.0 (or newer)
 */

// ============================================================
// QUICK START (5 MINUTES)
// ============================================================

/**
 * STEP 1: Create Rate Limiters File
 * 
 * Copy the content of middleware/rateLimiters.ts
 * to your project.
 * 
 * File: src/middleware/rateLimiters.ts (350+ lines)
 */

/**
 * STEP 2: Apply to Routes
 * 
 * In your Express app:
 * 
 * import { rateLimiters } from '@/middleware/rateLimiters';
 * 
 * app.post('/api/auth/login', rateLimiters.login, loginHandler);
 * app.post('/api/auth/register', rateLimiters.register, registerHandler);
 * app.post('/api/posts', authMiddleware, rateLimiters.createPost, postHandler);
 */

/**
 * STEP 3: Enable Trust Proxy
 * 
 * If behind a proxy (Nginx, Cloudflare, etc.):
 * 
 * app.set('trust proxy', 1);  // Trust 1 proxy level
 * 
 * Important: Without this, all users appear as proxy IP!
 */

/**
 * STEP 4: Test It Works
 * 
 * # Make 6 quick login attempts
 * for i in {1..6}; do
 *   curl -X POST http://localhost:3001/api/auth/login \
 *     -d '{"email":"test@example.com","password":"wrong"}' \
 *     -H "Content-Type: application/json" -w "%{http_code}\n"
 *   sleep 0.5
 * done
 * 
 * Expected output:
 * 401 (wrong password)
 * 401 (wrong password)
 * 401 (wrong password)
 * 401 (wrong password)
 * 401 (wrong password)
 * 429 (rate limited!)
 */

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

/**
 * Optional environment variables for rate limiting:
 * 
 * RATE_LIMIT_PREFIX
 *   - Prefix for Redis keys
 *   - Default: 'rl:'
 *   - Example: 'rl:'
 * 
 * RATE_LIMIT_WHITELIST
 *   - IP addresses to skip rate limiting
 *   - Comma-separated list
 *   - Default: 'localhost,127.0.0.1'
 *   - Example: '192.168.1.1,10.0.0.5'
 * 
 * REDIS_URL
 *   - Redis connection string (optional)
 *   - If not set, uses in-memory store
 *   - Example: 'redis://:password@localhost:6379'
 *   - Production: Required for distributed limiting
 * 
 * NODE_ENV
 *   - Environment: development, staging, production
 *   - For logging and store selection
 */

/**
 * Update .env file:
 * 
 * # Rate Limiting
 * RATE_LIMIT_PREFIX=rl:
 * RATE_LIMIT_WHITELIST=127.0.0.1,localhost
 * 
 * # Redis (production only)
 * REDIS_URL=redis://localhost:6379
 * 
 * # Node environment
 * NODE_ENV=development
 */

// ============================================================
// PRODUCTION SETUP
// ============================================================

/**
 * FOR PRODUCTION, follow these steps:
 * 
 * 1. SET UP REDIS
 *    ✓ Install Redis (Docker, managed service, or dedicated)
 *    ✓ Set REDIS_URL env var
 *    ✓ Configure Redis password (strong!)
 *    ✓ Enable Redis persistence (RDB/AOF)
 *    ✓ Set maxmemory eviction policy: allkeys-lru
 * 
 * 2. TRUST PROXY CORRECTLY
 *    ✓ Know your proxy setup (Cloudflare, Nginx, etc.)
 *    ✓ Set correct trust proxy level
 *    ✓ Verify IP detection: console.log(getClientIp(req))
 * 
 * 3. CONFIGURE WHITELIST
 *    ✓ Add health check IPs (monitoring)
 *    ✓ Add internal service IPs
 *    ✓ Add load balancer IPs (if applicable)
 *    ✓ Review regularly
 * 
 * 4. MONITORING
 *    ✓ Set up Prometheus metrics
 *    ✓ Configure Elasticsearch logging
 *    ✓ Set up alerting
 *    ✓ Monitor Redis memory
 * 
 * 5. TESTING
 *    ✓ Load test with production limits
 *    ✓ Test failover (Redis down)
 *    ✓ Test with real traffic patterns
 *    ✓ Verify no false positives
 */

/**
 * REDIS SETUP EXAMPLE (Docker):
 * 
 * docker run -d \
 *   --name redis-rate-limit \
 *   -p 6379:6379 \
 *   -e REDIS_PASSWORD=strong-password-here \
 *   redis:7-alpine \
 *   redis-server --requirepass strong-password-here
 * 
 * Verify:
 * redis-cli -a strong-password-here ping
 * 
 * Connection string:
 * REDIS_URL=redis://:strong-password-here@redis-host:6379
 */

/**
 * REDIS SETUP EXAMPLE (Managed AWS):
 * 
 * Create ElastiCache cluster in AWS console:
 * - Engine: Redis
 * - Version: 7.0+
 * - Node type: cache.t3.micro (development)
 * - Cluster mode: disabled
 * - Automatic failover: enabled
 * - Auth token: strong password
 * 
 * Connection string:
 * REDIS_URL=redis://:auth-token@primary-endpoint:6379
 */

// ============================================================
// PROXY CONFIGURATION
// ============================================================

/**
 * IF BEHIND NGINX:
 * 
 * Nginx config:
 * location /api {
 *   proxy_pass http://localhost:3001;
 *   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *   proxy_set_header X-Real-IP $remote_addr;
 * }
 * 
 * Express config:
 * app.set('trust proxy', 1);
 */

/**
 * IF BEHIND CLOUDFLARE:
 * 
 * Cloudflare automatically sets headers:
 * - CF-Connecting-IP
 * - X-Forwarded-For
 * 
 * Express config:
 * app.set('trust proxy', 1);
 * 
 * Rate limiter will detect Cloudflare automatically.
 */

/**
 * IF BEHIND AWS LOAD BALANCER:
 * 
 * Load balancer header:
 * X-Forwarded-For: client-ip, load-balancer-ip
 * 
 * Express config:
 * app.set('trust proxy', 1);  // Trust 1 level (load balancer)
 * 
 * The rate limiter will extract the real client IP.
 */

/**
 * IF BEHIND AZURE APPLICATION GATEWAY:
 * 
 * Header: X-Forwarded-For
 * 
 * Express config:
 * app.set('trust proxy', 1);
 */

/**
 * VERIFY IP DETECTION:
 * 
 * Add test endpoint:
 * app.get('/api/debug/ip', (req, res) => {
 *   res.json({
 *     clientIp: getClientIp(req),
 *     req_ip: req.ip,
 *     req_ips: req.ips,
 *     headers: {
 *       'x-forwarded-for': req.headers['x-forwarded-for'],
 *       'x-real-ip': req.headers['x-real-ip'],
 *       'cf-connecting-ip': req.headers['cf-connecting-ip']
 *     }
 *   });
 * });
 * 
 * Test from different IPs and verify correct IP is detected.
 */

// ============================================================
// FINE-TUNING LIMITS
// ============================================================

/**
 * STEP 1: Collect Baseline DATA
 * 
 * Monitor real usage for 1-2 weeks:
 * 
 * For each endpoint:
 * - Peak requests per minute (peak)
 * - Average requests per minute (avg)
 * - 99th percentile (p99)
 * - Single user max per minute
 * 
 * Example login data:
 * - Peak: 100 logins/min (5 per sec)
 * - Avg: 10 logins/min
 * - P99: 50 logins/min
 * - Per user: max 2 per minute (legitimate)
 * 
 * Example post data:
 * - Peak: 500 posts/min during events
 * - Avg: 50 posts/min
 * - P99: 200 posts/min
 * - Per user: max 5 per minute (content creators)
 */

/**
 * STEP 2: SET LIMITS ABOVE P99
 * 
 * Rule of thumb:
 * - Set limit at 2x-3x the p99
 * - This catches abuse while allowing legitimate spikes
 * 
 * For post creation:
 * - P99: 200 posts/min total
 * - Per user P99: 5 posts/min
 * - Set per user limit: 20 (4x)
 * 
 * For login:
 * - Legitimate: 1 login per user per day
 * - Set per IP limit: 5 (allows retries)
 */

/**
 * STEP 3: ADJUST BASED ON FEEDBACK
 * 
 * After deployment:
 * - Week 1: Monitor error rate
 * - Week 2: Review user complaints
 * - Week 3+: Adjust if needed
 * 
 * If >0.1% hit rate: limits probably too strict
 * If <0.01% hit rate: limits probably ok
 * If spam increases: limits too loose
 */

/**
 * EXAMPLE LIMIT ADJUSTMENT:
 * 
 * Current: loginLimiter (5 per minute)
 * Feedback: No complaints, no hits
 * Assessment: Limit is fine (well below p99)
 * Action: Keep as is
 * 
 * Current: postLimiter (20 per minute)
 * Feedback: 0.5% hit rate, users complain
 * Assessment: Limit too strict
 * Action: Increase to 50 posts per minute
 */

// ============================================================
// INTEGRATION WITH EXISTING CODE
// ============================================================

/**
 * BEFORE (No rate limiting):
 * 
 * app.post('/api/auth/login', loginHandler);
 */

/**
 * AFTER (With rate limiting):
 * 
 * import { rateLimiters } from '@/middleware/rateLimiters';
 * 
 * app.post('/api/auth/login',
 *   rateLimiters.login,  // ← Add this line
 *   loginHandler
 * );
 */

/**
 * BEFORE (Posts with auth):
 * 
 * app.post('/api/posts', authMiddleware, postHandler);
 */

/**
 * AFTER (With auth + rate limiting):
 * 
 * app.post('/api/posts',
 *   authMiddleware,
 *   rateLimiters.createPost,  // ← Add this line
 *   postHandler
 * );
 */

/**
 * BEFORE (Auto-applying global limit):
 * 
 * app.use(someMiddleware);
 * app.use(anotherMiddleware);
 */

/**
 * AFTER (Apply global rate limiter):
 * 
 * app.use(someMiddleware);
 * app.use(anotherMiddleware);
 * app.use(rateLimiters.global);  // ← Add as fallback
 */

// ============================================================
// TROUBLESHOOTING INSTALLATION
// ============================================================

/**
 * ERROR: Cannot find module 'express-rate-limit'
 * 
 * Solution:
 * npm install express-rate-limit
 * npm install --save-dev @types/express-rate-limit
 * 
 * Verify:
 * ls node_modules/express-rate-limit
 */

/**
 * ERROR: Cannot find module 'rate-limit-redis'
 * 
 * Solution (if REDIS_URL is set):
 * npm install rate-limit-redis redis
 * 
 * Or set REDIS_URL to empty to use memory store.
 */

/**
 * ERROR: getClientIp is not a function
 * 
 * Solution:
 * Make sure getClientIp is exported from rateLimiters.ts
 * 
 * export function getClientIp(req: Request): string {
 *   // ... implementation
 * }
 */

/**
 * ERROR: Rate limits not working
 * 
 * Debug:
 * 1. Check middleware is applied
 * 2. Check trust proxy: app.set('trust proxy', 1)
 * 3. Check store is initialized
 * 4. Verify skip() function
 * 5. Check logs: console.warn(...)
 * 
 * Add debug logging:
 * const loginLimiter = rateLimit({
 *   // ... config
 *   skip: (req, res) => {
 *     const skipped = shouldSkip(req);
 *     if (skipped) console.log('Skipping rate limit for', req.ip);
 *     return skipped;
 *   }
 * });
 */

/**
 * ERROR: Getting your IP is 127.0.0.1 behind proxy
 * 
 * Solution:
 * app.set('trust proxy', 1);  // Add this line
 * 
 * Or if you need to trust multiple proxies:
 * app.set('trust proxy', 2);  // Trust 2 levels
 * 
 * Then verify:
 * app.get('/api/debug/ip', (req, res) => {
 *   res.json({ ip: getClientIp(req) });
 * });
 */

// ============================================================
// CHECKLIST FOR DEPLOYMENT
// ============================================================

/**
 * BEFORE DEPLOYING TO PRODUCTION:
 * 
 * [ ] express-rate-limit installed
 * [ ] rateLimiters.ts created
 * [ ] All routes have rate limiters applied
 * [ ] trust proxy configured correctly
 * [ ] Redis setup (if needed)
 * [ ] REDIS_URL env var configured
 * [ ] RATE_LIMIT_WHITELIST configured
 * [ ] IP detection verified (/api/debug/ip)
 * [ ] Rate limits tested locally
 * [ ] Monitoring/alerting configured
 * [ ] npm run build succeeds
 * [ ] npm run typecheck succeeds
 * [ ] Logs to check: rate limit hits
 * [ ] Metrics to monitor: 429 error rate
 * [ ] Rollback plan documented
 * [ ] Team trained on limits
 * [ ] Documentation updated
 */

/**
 * POST-DEPLOYMENT (First 24 Hours):
 * 
 * [ ] Monitor error rate (should be <0.1%)
 * [ ] Check for rate limit 429 errors
 * [ ] Review user complaints
 * [ ] Verify Redis is working (if used)
 * [ ] Check disk space
 * [ ] Monitor CPU/memory
 * [ ] Run load tests
 * [ ] Review logs for patterns
 * [ ] Check alert rules firing
 * [ ] Plan adjustments if needed
 */

export {};
