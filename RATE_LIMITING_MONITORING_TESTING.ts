/**
 * RATE LIMITING - MONITORING & TESTING GUIDE
 * 
 * Complete guide for testing rate limits and monitoring compliance
 */

// ============================================================
// TESTING RATE LIMITS
// ============================================================

/**
 * TEST 1: LOGIN RATE LIMITING (5 per minute per IP)
 * 
 * Objective: Verify login endpoint limits 5 attempts per minute
 * Expected: Requests 1-5 succeed (or fail normally), request 6 returns 429
 * 
 * Shell Script:
 */

/**
bash
#!/bin/bash

# Test login rate limiting (5 per minute)
echo "Testing login rate limit (5 per minute)..."

for i in {1..7}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done

# Expected output:
# Attempts 1-5: 401 Unauthorized (invalid credentials)
# Attempt 6+: 429 Too Many Requests (rate limited)
*/

/**
 * TEST 2: REGISTRATION RATE LIMITING (3 per hour per IP)
 * 
 * Objective: Verify registration limits 3 accounts per hour
 * Expected: First 3 registrations may succeed, 4th returns 429
 * 
 * Shell Script:
 */

/**
bash
#!/bin/bash

# Test registration rate limiting (3 per hour)
echo "Testing registration rate limit (3 per hour)..."

for i in {1..5}; do
  echo "Registration attempt $i:"
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@example.com\",\"password\":\"password123\"}" \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done

# Expected output:
# Attempts 1-3: 201 Created or 409 Conflict
# Attempts 4+: 429 Too Many Requests
*/

/**
 * TEST 3: POST CREATION RATE LIMITING (20 per minute per user)
 * 
 * Objective: Verify post creation limits 20 per minute per authenticated user
 * Expected: Requests 1-20 succeed, request 21 returns 429
 * 
 * Shell Script:
 */

/**
bash
#!/bin/bash

# First, get authentication token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct"}' | jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "Testing post creation rate limit (20 per minute)..."
echo "Using token: $TOKEN"

for i in {1..22}; do
  echo "Post attempt $i:"
  curl -X POST http://localhost:3001/api/posts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"content\":\"Test post $i\"}" \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.1
done

# Expected output:
# Attempts 1-20: 201 Created
# Attempts 21+: 429 Too Many Requests
*/

/**
 * TEST 4: DIFFERENT IP ADDRESSES
 * 
 * Objective: Verify each IP has separate rate limit
 * Expected: Each IP gets independent counter
 * 
 * Shell Script:
 */

/**
bash
#!/bin/bash

echo "Testing rate limits per IP (should each get 5 attempts)..."

# IP 1
echo "IP 1 (127.0.0.1):"
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 127.0.0.1" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "Status: %{http_code}\n"
  sleep 0.5
done

echo "\nIP 2 (192.168.1.100):"
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.100" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "Status: %{http_code}\n"
  sleep 0.5
done

# Expected: Each IP independently limited
# IP 1: 5 × 401, then 429
# IP 2: 5 × 401, then 429
*/

/**
 * TEST 5: WHITELIST VERIFICATION
 * 
 * Objective: Verify whitelisted IPs bypass rate limiting
 * Expected: Localhost (127.0.0.1) can make unlimited requests
 * 
 * Shell Script:
 */

/**
bash
#!/bin/bash

echo "Testing rate limit whitelist (localhost should not be limited)..."

for i in {1..100}; do
  curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    > /dev/null
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "Completed $i requests (all should succeed)"
  fi
done

echo "✓ All 100 requests succeeded (no rate limiting)"
*/

/**
 * TEST 6: ASYNC VERIFICATION
 * 
 * Objective: Test rate limiting with concurrent requests
 * Expected: All concurrent requests within window get through, excess gets 429
 * 
 * Node.js Script:
 */

/**
import axios from 'axios';

async function testConcurrentRateLimit() {
  const TOKEN = 'your-auth-token';
  const baseURL = 'http://localhost:3001';
  
  console.log('Testing concurrent POST requests (20 per minute limit)...');
  
  // Send 25 concurrent requests (should get some 429s)
  const requests = [];
  for (let i = 0; i < 25; i++) {
    requests.push(
      axios.post(`${baseURL}/api/posts`, {
        content: `Test post ${i}`
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      }).then(res => ({ success: true, status: res.status }))
        .catch(err => ({ success: false, status: err.response?.status }))
    );
  }
  
  const results = await Promise.all(requests);
  
  const successful = results.filter(r => r.success || r.status === 201).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log(`✓ Successful: ${successful}`);
  console.log(`⚠️ Rate limited (429): ${rateLimited}`);
  console.log(`Expected: ~20 successful, ~5 rate limited`);
}

testConcurrentRateLimit();
*/

// ============================================================
// MONITORING RATE LIMITS
// ============================================================

/**
 * METRICS TO MONITOR
 * 
 * 1. Rate Limit Hit Rate
 *    - How often limits are hit per endpoint
 *    - Should be <1% for legitimate endpoints
 *    - >5% suggests legitimate users blocked
 * 
 * 2. Top Rate Limited IPs
 *    - Which IP addresses hit limits most
 *    - Potential bot attack if same IP repeatedly
 *    - Potential business logic issue if familiar IPs
 * 
 * 3. Top Rate Limited Users
 *    - Which authenticated users hit limits
 *    - Normal users shouldn't hit content limits
 *    - Potential use case change
 * 
 * 4. Rate Limit by Endpoint
 *    - /api/auth/login - should be high (attacks)
 *    - /api/posts - should be low (users)
 *    - /api/posts/like - might be high (rapid clicking ok)
 * 
 * 5. False Positive Rate
 *    - Legitimate users mistakenly rate limited
 *    - Monitor complaints
 *    - Adjust limits if too strict
 */

/**
 * PROMETHEUS METRICS
 * 
 * # Add to rate limiter middleware:
 * 
 * import prometheus from 'prom-client';
 * 
 * const rateLimitHitsCounter = new prometheus.Counter({
 *   name: 'rate_limit_hits_total',
 *   help: 'Total rate limit hits',
 *   labelNames: ['endpoint', 'ip_hash']
 * });
 * 
 * function handleRateLimitExceeded(req, res, endpoint) {
 *   const ipHash = crypto.createHash('sha256')
 *     .update(getClientIp(req))
 *     .digest('hex');
 *   
 *   rateLimitHitsCounter.inc({ endpoint, ip_hash: ipHash });
 *   
 *   res.status(429).json({...});
 * }
 * 
 * // Export metrics endpoint
 * app.get('/metrics', async (req, res) => {
 *   res.set('Content-Type', prometheus.register.contentType);
 *   res.end(await prometheus.register.metrics());
 * });
 */

/**
 * LOGGING RATE LIMIT EVENTS
 * 
 * Log structure:
 */

const rateLimitLogExample = {
  timestamp: '2026-02-17T10:30:45.123Z',
  type: 'rate_limit_hit',
  endpoint: '/api/auth/login',
  ip: '192.168.1.100',
  ipHash: 'abc123def456', // Hashed for privacy
  userId: 'user_12345',
  limit: 5,
  window: '1 minute',
  windowMs: 60000,
  attempt: 6, // 6th request (exceeds limit of 5)
  method: 'POST',
  userAgent: 'Mozilla/5.0...',
  referer: 'https://vairo.app/login'
};

/**
 * LOG PARSING EXAMPLE
 * 
 * Elasticsearch query to find attacks:
 */

/**
GET /rate-limit-logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "type": "rate_limit_hit" } },
        { "match": { "endpoint": "/api/auth/login" } }
      ]
    }
  },
  "aggs": {
    "hits_by_ip": {
      "terms": {
        "field": "ipHash.keyword",
        "size": 20,
        "order": { "_count": "desc" }
      }
    },
    "hits_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "interval": "5m"
      }
    }
  }
}

// Results show:
// - Which IPs hitting limits most
// - Spike in rate limit hits = potential attack
// - Normal pattern = few hits per day
// - Attack pattern = 100+ hits per minute
*/

// ============================================================
// ALERTING RULES
// ============================================================

/**
 * ALERT 1: High Rate Limit Hit Rate
 * 
 * Condition: >100 rate limit hits in 5 minutes
 * Action: Page on-call engineer
 * Reason: Potential DDoS or bot attack
 * 
 * Prometheus Alert:
 */

/**
alert: HighRateLimitHitRate
expr: rate(rate_limit_hits_total[5m]) > 100
for: 1m
annotations:
  summary: "High rate limit hit rate"
  description: "{{ $value }} rate limit hits per second"
*/

/**
 * ALERT 2: Specific IP Abuse
 * 
 * Condition: Single IP hits limit >20 times in 1 hour
 * Action: Add to firewall blocklist
 * Reason: Clear attack pattern
 * 
 * Elasticsearch Alert:
 */

/**
Condition:
- Query: rate_limit_hits from last 1 hour
- Group by: ipHash
- Alert if: any ipHash > 20 hits
- Action: Send to security team
- Auto-action: Add IP to fail2ban
*/

/**
 * ALERT 3: Unusual Pattern Detection
 * 
 * Condition: Normal endpoint suddenly has rate limits
 * Example: /api/posts suddenly gets 20 rate limit hits (unusual)
 * Action: Investigate potential abuse
 * Reason: Different endpoint = different attack vector
 */

/**
 * ALERT 4: Rate Limiting System Down
 * 
 * Condition: Redis unavailable OR rate limit errors
 * Action: Page all engineers
 * Reason: Rate limiting not active = API vulnerable to abuse
 * 
 * Check: Redis connectivity, memory usage, CPU
 */

// ============================================================
// TROUBLESHOOTING COMMON ISSUES
// ============================================================

/**
 * ISSUE 1: Legitimate users getting rate limited
 * 
 * Symptoms:
 * - Users complain they can't post
 * - Multiple reports from same geographic area
 * - Happens at specific times (peak hours)
 * 
 * Causes:
 * - Limits too strict
 * - Shared IP (corporate network)
 * - Mobile carrier (multiple users = same IP)
 * 
 * Solutions:
 * - Increase limits (e.g., 20 → 50 posts/minute)
 * - Use authenticated user ID instead of IP
 * - Add whitelist for known shared IPs
 * - Implement tiered limits (new users stricter)
 */

/**
 * ISSUE 2: Rate limiting not working
 * 
 * Symptoms:
 * - Can send unlimited requests
 * - No 429 responses
 * - No rate limit errors
 * 
 * Causes:
 * - Redis not configured
 * - Wrong trust proxy level
 * - Rate limiter not applied to routes
 * - In-memory store cleared on restart
 * 
 * Debug Steps:
 * 1. Check Redis connection: redis-cli ping
 * 2. Verify middleware applied: console.log(rateLimiters.login)
 * 3. Check trust proxy: app.set('trust proxy', 1)
 * 4. Check IP detection: console.log(getClientIp(req))
 * 5. Increase log level: DEBUG=* node server.js
 */

/**
 * ISSUE 3: Rate limits too aggressive
 * 
 * Symptoms:
 * - Many 429 responses
 * - False positive complaints
 * - Users blocking functionality
 * 
 * Causes:
 * - Limits too low
 * - Testing tools hammering endpoints
 * - Legitimate bots (search crawlers)
 * 
 * Solutions:
 * - Increase limits gradually
 * - Whitelist search engines (Google, Bing)
 * - Whitelist testing tools (monitoring)
 * - Implement request coalescing (batching)
 */

/**
 * ISSUE 4: High memory usage in rate limiter
 * 
 * Symptoms:
 * - Server memory keeps growing
 * - Crashes after hours/days
 * - Memory not freed
 * 
 * Causes:
 * - Memory store not cleaning old entries
 * - Redis memory limit exceeded
 * - Too many unique keys
 * 
 * Solutions:
 * - Use Redis (cleanup automatic)
 * - Reduce key uniqueness (hash IPs)
 * - Increase Redis max memory
 * - Monitor Redis memory: INFO memory
 */

// ============================================================
// PERFORMANCE TESTING
// ============================================================

/**
 * LOAD TEST: Can rate limiter handle 1000s of requests?
 * 
 * Tool: Apache Bench (ab)
 */

/**
bash
# Test 1000 concurrent requests
ab -n 10000 -c 1000 http://localhost:3001/api/auth/login

# Expected:
# - Most requests blocked after hitting limits
# - Response time <50ms
# - No server crashes
# - Redis can handle it
*/

/**
 * STRESS TEST: Rate limiter with Redis failures
 * 
 * Simulate Redis going down:
 */

/**
bash
# Connect to Redis and simulate slowness
redis-cli CONFIG SET slowlog-log-slower-than 10000
redis-cli CONFIG SET slowlog-max-len 1000

# Monitor slowlog
redis-cli SLOWLOG GET 10

# Should see:
# - First few requests succeed
# - Then fallback to memory store
# - No request loss (graceful degradation)
*/

// ============================================================
// MAINTENANCE & UPDATES
// ============================================================

/**
 * WEEKLY MAINTENANCE
 * 
 * [ ] Review rate limit metrics
 * [ ] Check for unusual patterns
 * [ ] Review false positive reports
 * [ ] Check Redis memory usage
 * [ ] Verify all alerts working
 */

/**
 * MONTHLY MAINTENANCE
 * 
 * [ ] Analyze rate limit trends
 * [ ] Adjust limits based on usage
 * [ ] Review attack patterns
 * [ ] Update whitelist if needed
 * [ ] Test failover procedures
 */

/**
 * QUARTERLY REVIEW
 * 
 * [ ] Full rate limiting audit
 * [ ] Load test with new limits
 * [ ] Security review
 * [ ] Cost optimization (Redis)
 * [ ] Document lessons learned
 */

export {};
