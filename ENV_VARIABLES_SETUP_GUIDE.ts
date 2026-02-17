/**
 * ENVIRONMENT VARIABLES SETUP GUIDE
 * 
 * Complete guide for configuring frontend and backend
 * Authentication and RBAC system environment variables
 */

// ============================================================
// FRONTEND (.env for React Native / Expo)
// ============================================================

/**
 * Required Variables for Frontend:
 * 
 * EXPO_PUBLIC_API_URL
 *   - Purpose: Backend API base URL
 *   - Format: https://api.example.com (production)
 *             http://localhost:3001 (development)
 *   - Must be accessible from mobile device
 *   - Include protocol and port
 * 
 * EXPO_PUBLIC_API_TIMEOUT
 *   - Purpose: Request timeout in milliseconds
 *   - Default: 30000 (30 seconds)
 *   - Typical: 15000-60000
 * 
 * EXPO_PUBLIC_SESSION_STORAGE_KEY
 *   - Purpose: localStorage key for auth state
 *   - Default: vairo_auth
 *   - Can be any unique key
 * 
 * EXPO_PUBLIC_TOKEN_REFRESH_BUFFER
 *   - Purpose: Milliseconds before expiration to refresh
 *   - Default: 60000 (60 seconds)
 *   - Ensures token not expired during request
 */

// ============================================================
// BACKEND (.env for Node.js / Express)
// ============================================================

/**
 * JWT Configuration:
 * 
 * JWT_SECRET
 *   - Purpose: Sign access tokens
 *   - Length: Minimum 32 characters
 *   - Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *   - Example: aB1!dE2@fG3#hI4$jK5%lM6^nO7&pQ8*rS9
 *   - Change: Never share, never hardcode, use env vars
 * 
 * JWT_REFRESH_SECRET
 *   - Purpose: Sign refresh tokens
 *   - Length: Minimum 32 characters
 *   - Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *   - Requirement: Must be different from JWT_SECRET
 *   - Change: Rotate every 6 months in production
 * 
 * JWT_EXPIRATION
 *   - Purpose: Access token lifetime
 *   - Format: "15m", "2h", "24h" (expires format)
 *   - Typical: 15m (15 minutes)
 *   - Short: Limits damage if token stolen
 * 
 * JWT_REFRESH_EXPIRATION
 *   - Purpose: Refresh token lifetime
 *   - Format: Same as JWT_EXPIRATION
 *   - Typical: 7d (7 days)
 *   - Long: Users stay logged in longer
 */

/**
 * Database Configuration:
 * 
 * DATABASE_URL
 *   - Purpose: Connection string to user database
 *   - Format PostgreSQL: postgresql://user:password@host:port/dbname
 *   - Format MySQL: mysql://user:password@host:port/dbname
 *   - Example: postgresql://vairo:secure_pass@db.example.com:5432/vairo_prod
 *   - Requirements:
 *     1. User with CREATE TABLE permission (for migrations)
 *     2. Strong password (20+ chars, mixed case + numbers + symbols)
 *     3. SSL/TLS required in production
 * 
 * DATABASE_DIALECT
 *   - Purpose: Specify database type
 *   - Options: postgresql, mysql, sqlite, mssql
 *   - Default: postgresql (recommended)
 * 
 * DATABASE_PORT
 *   - Purpose: Database server port
 *   - PostgreSQL default: 5432
 *   - MySQL default: 3306
 * 
 * DATABASE_SSL
 *   - Purpose: Enable SSL for database connection
 *   - Options: true, false
 *   - Production: Always true
 *   - Development: Can be false for local database
 */

/**
 * Redis Configuration (for Token Blacklist):
 * 
 * REDIS_URL
 *   - Purpose: Redis server for distributed token blacklist
 *   - Format: redis://[:password@]host[:port]
 *   - Default: redis://localhost:6379
 *   - Production: Use hosted Redis (AWS ElastiCache, etc.)
 *   - Required: For distributed systems
 * 
 * REDIS_TLS
 *   - Purpose: Enable TLS for Redis connection
 *   - Options: true, false
 *   - Production: true
 *   - Development: false (if local)
 */

/**
 * CORS Configuration:
 * 
 * CORS_ORIGIN
 *   - Purpose: Allowed origins for CORS requests
 *   - Format: "http://localhost:8081,https://app.vairo.app"
 *   - Development: http://localhost:8081,http://localhost:3000
 *   - Production: https://app.vairo.app
 *   - Security: List exact URLs, no wildcards
 *   - Multiple: Separate by comma
 * 
 * CREDENTIALS_ALLOWED
 *   - Purpose: Allow credentials (cookies, auth) in CORS
 *   - Options: true, false
 *   - Default: true (needed for HTTP-only refresh token)
 */

/**
 * Rate Limiting:
 * 
 * RATE_LIMIT_WINDOW
 *   - Purpose: Time window for rate limit (minutes)
 *   - Typical: 15 minutes
 *   - Development: Can be higher
 *   - Production: Keep at 15
 * 
 * RATE_LIMIT_MAX_REQUESTS
 *   - Purpose: Max requests per window per IP
 *   - Typical: 100 requests per 15 minutes
 *   - Development: 1000 (minimal limiting)
 *   - Production: 50 (strict)
 * 
 * AUTH_RATE_LIMIT_MAX
 *   - Purpose: Max failed login attempts
 *   - Typical: 5 failed attempts
 *   - Then locked for AUTH_RATE_LIMIT_WINDOW
 *   - Production: 3 (very strict)
 * 
 * AUTH_RATE_LIMIT_WINDOW
 *   - Purpose: Lockout duration (minutes)
 *   - Typical: 15 minutes
 *   - After max failed attempts, locked for this duration
 */

/**
 * Email Configuration (for Password Reset):
 * 
 * EMAIL_SERVICE
 *   - Purpose: Email service provider
 *   - Options: smtp, sendgrid, aws_ses, mailgun
 *   - Default: smtp
 * 
 * EMAIL_HOST
 *   - Purpose: SMTP server host
 *   - Examples:
 *     - Gmail: smtp.gmail.com
 *     - Outlook: smtp-mail.outlook.com
 *     - Custom: mail.example.com
 * 
 * EMAIL_PORT
 *   - Purpose: SMTP port
 *   - 587: TLS (recommended)
 *   - 465: SSL
 *   - 25: Plain (avoid in production)
 * 
 * EMAIL_USER
 *   - Purpose: SMTP username (usually email)
 *   - Example: no-reply@example.com
 * 
 * EMAIL_PASSWORD
 *   - Purpose: SMTP password
 *   - WARNING: Not your real password
 *   - Gmail: Use "App Passwords" (16 chars)
 *   - Other: Check service documentation
 * 
 * EMAIL_FROM
 *   - Purpose: From address in emails
 *   - Format: "Name <email@example.com>" or "email@example.com"
 *   - Example: "Vairo Support <support@vairo.app>"
 *   - Must match sending domain
 */

/**
 * Logging:
 * 
 * LOG_LEVEL
 *   - Purpose: Minimum log level to display
 *   - Options: error, warn, info, debug, trace
 *   - Development: debug (very detailed)
 *   - Production: warn (only warnings/errors)
 *   - Typical: info
 * 
 * LOG_FORMAT
 *   - Purpose: Log output format
 *   - Options: json, text, pretty
 *   - Production: json (for log parsing)
 *   - Development: pretty (human readable)
 */

/**
 * HTTPS/Security:
 * 
 * HTTPS
 *   - Purpose: Enable HTTPS
 *   - Options: true, false
 *   - Production: Always true
 *   - Development: Can be false (localhost)
 * 
 * SSL_CERT_PATH
 *   - Purpose: Path to SSL certificate file
 *   - Format: /etc/ssl/certs/cert.pem
 *   - Required: Only if HTTPS=true
 *   - Generation: Let's Encrypt (free), Cloudflare, etc.
 * 
 * SSL_KEY_PATH
 *   - Purpose: Path to SSL private key
 *   - Format: /etc/ssl/private/key.pem
 *   - Required: Only if HTTPS=true
 *   - Permissions: 600 (readable by process only)
 * 
 * HSTS_MAX_AGE
 *   - Purpose: HTTP Strict Transport Security max age
 *   - Value: 31536000 (1 year, recommended)
 *   - Effect: Browser enforces HTTPS
 * 
 * CSP_POLICY
 *   - Purpose: Content Security Policy
 *   - Default: "default-src 'self'"
 *   - Prevents: XSS, clickjacking, etc.
 */

/**
 * Feature Flags:
 * 
 * REQUIRE_EMAIL_VERIFICATION
 *   - Purpose: Require email verification before login
 *   - Options: true, false
 *   - Development: false (easier testing)
 *   - Production: true (security)
 * 
 * ALLOW_GUEST_LOGIN
 *   - Purpose: Allow guest/anonymous authentication
 *   - Options: true, false
 *   - Typical: false (require login)
 * 
 * TOKEN_BLACKLIST_ENABLED
 *   - Purpose: Blacklist tokens on logout
 *   - Options: true, false
 *   - Production: true (required for security)
 *   - Requires: Redis configured
 * 
 * AUDIT_LOGGING_ENABLED
 *   - Purpose: Log all admin/sensitive actions
 *   - Options: true, false
 *   - Production: true (compliance, security)
 */

// ============================================================
// ENVIRONMENT-SPECIFIC EXAMPLES
// ============================================================

/**
 * DEVELOPMENT (.env.local):
 * 
 * EXPO_PUBLIC_API_URL=http://localhost:3001/api
 * EXPO_PUBLIC_API_TIMEOUT=30000
 * 
 * NODE_ENV=development
 * PORT=3001
 * JWT_SECRET=dev-secret-32-chars-minimum-for-local-testing
 * JWT_REFRESH_SECRET=dev-refresh-secret-32-chars-minimum
 * JWT_EXPIRATION=15m
 * JWT_REFRESH_EXPIRATION=7d
 * 
 * DATABASE_URL=postgresql://vairo:dev-password@localhost:5432/vairo_dev
 * DATABASE_SSL=false
 * 
 * REDIS_URL=redis://localhost:6379
 * REDIS_TLS=false
 * 
 * CORS_ORIGIN=http://localhost:8081,http://localhost:19000
 * CREDENTIALS_ALLOWED=true
 * 
 * RATE_LIMIT_MAX_REQUESTS=1000
 * AUTH_RATE_LIMIT_MAX=10
 * 
 * HTTPS=false
 * LOG_LEVEL=debug
 * REQUIRE_EMAIL_VERIFICATION=false
 * ALLOW_GUEST_LOGIN=true
 * TOKEN_BLACKLIST_ENABLED=true
 */

/**
 * STAGING (.env.staging):
 * 
 * EXPO_PUBLIC_API_URL=https://api-staging.vairo.app
 * EXPO_PUBLIC_API_TIMEOUT=30000
 * 
 * NODE_ENV=staging
 * PORT=443
 * JWT_SECRET=<32-char production-grade secret>
 * JWT_REFRESH_SECRET=<32-char production-grade secret>
 * JWT_EXPIRATION=15m
 * JWT_REFRESH_EXPIRATION=7d
 * 
 * DATABASE_URL=postgresql://app_user:strong-password@db.staging.vairo.app/vairo_staging
 * DATABASE_SSL=true
 * 
 * REDIS_URL=redis://:strong-password@redis.staging.vairo.app:6379
 * REDIS_TLS=true
 * 
 * CORS_ORIGIN=https://staging.vairo.app
 * CREDENTIALS_ALLOWED=true
 * 
 * RATE_LIMIT_MAX_REQUESTS=100
 * AUTH_RATE_LIMIT_MAX=5
 * 
 * HTTPS=true
 * SSL_CERT_PATH=/etc/ssl/certs/staging-cert.pem
 * SSL_KEY_PATH=/etc/ssl/private/staging-key.pem
 * 
 * LOG_LEVEL=info
 * LOG_FORMAT=json
 * REQUIRE_EMAIL_VERIFICATION=true
 * ALLOW_GUEST_LOGIN=false
 * TOKEN_BLACKLIST_ENABLED=true
 */

/**
 * PRODUCTION (.env.production):
 * 
 * EXPO_PUBLIC_API_URL=https://api.vairo.app
 * EXPO_PUBLIC_API_TIMEOUT=30000
 * 
 * NODE_ENV=production
 * PORT=443
 * JWT_SECRET=<strong 64-char random production secret>
 * JWT_REFRESH_SECRET=<strong 64-char random production secret>
 * JWT_EXPIRATION=15m
 * JWT_REFRESH_EXPIRATION=7d
 * 
 * DATABASE_URL=postgresql://app_user:very-strong-password@db.vairo.app/vairo_prod
 * DATABASE_SSL=true
 * DATABASE_SSL_MODE=require
 * 
 * REDIS_URL=redis://:very-strong-password@redis.vairo.app:6379
 * REDIS_TLS=true
 * 
 * CORS_ORIGIN=https://vairo.app,https://www.vairo.app
 * CREDENTIALS_ALLOWED=true
 * 
 * RATE_LIMIT_WINDOW=15
 * RATE_LIMIT_MAX_REQUESTS=50
 * AUTH_RATE_LIMIT_MAX=3
 * AUTH_RATE_LIMIT_WINDOW=15
 * 
 * HTTPS=true
 * SSL_CERT_PATH=/etc/ssl/certs/production-cert.pem
 * SSL_KEY_PATH=/etc/ssl/private/production-key.pem
 * HSTS_MAX_AGE=31536000
 * CSP_POLICY=default-src 'self'; script-src 'self' cdn.example.com
 * 
 * EMAIL_SERVICE=sendgrid
 * EMAIL_USER=sendgrid-api-key
 * EMAIL_FROM="Vairo Support <support@vairo.app>"
 * 
 * LOG_LEVEL=warn
 * LOG_FORMAT=json
 * REQUIRE_EMAIL_VERIFICATION=true
 * ALLOW_GUEST_LOGIN=false
 * TOKEN_BLACKLIST_ENABLED=true
 * AUDIT_LOGGING_ENABLED=true
 */

// ============================================================
// SECURITY BEST PRACTICES
// ============================================================

/**
 * Secret Generation:
 * 
 * Node.js:
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * 
 * Command Line:
 * openssl rand -hex 32
 * 
 * Online (use only for non-production):
 * https://generate-random.org/ (32 bytes)
 * 
 * Requirements:
 * - Minimum 32 characters (256 bits)
 * - Preferably 64+ characters (512 bits)
 * - Mix of upper, lowercase, numbers, symbols
 * - Unique per environment
 * - Never shared or committed
 */

/**
 * Secret Management:
 * 
 * ✅ DO:
 * - Use environment variables
 * - Use secret management service (AWS Secrets Manager, HashiCorp Vault)
 * - Rotate every 6 months
 * - Limit who can access
 * - Log access to secrets
 * - Use strong credentials
 * 
 * ❌ DON'T:
 * - Commit to git
 * - Hardcode in source
 * - Use weak values
 * - Share in emails/chat
 * - Use same secret everywhere
 * - Store unencrypted
 */

/**
 * Checking Your Environment:
 * 
 * Before deployment, verify:
 * [ ] JWT_SECRET is 32+ chars, random
 * [ ] JWT_REFRESH_SECRET is different and 32+ chars
 * [ ] HTTPS enabled in production
 * [ ] DATABASE_URL has strong password
 * [ ] REDIS_URL has authentication
 * [ ] CORS_ORIGIN is specific (no wildcards)
 * [ ] EMAIL configured correctly (if password reset needed)
 * [ ] All required vars are set
 * [ ] No secrets in code or git
 * [ ] Log level appropriate for environment
 */

export {};
