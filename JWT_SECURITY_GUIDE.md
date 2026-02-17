# JWT Security Implementation Guide

Complete guide for implementing secure JWT authentication with access tokens, refresh tokens, and token management.

**Last Updated:** February 17, 2026  
**Status:** Production-Ready  
**Security Level:** High

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Token Types & Expiration](#token-types--expiration)
3. [Token Flow Diagrams](#token-flow-diagrams)
4. [Implementation Guide](#implementation-guide)
5. [Security Best Practices](#security-best-practices)
6. [Common Vulnerabilities & Prevention](#common-vulnerabilities--prevention)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Token Strategy

**Access Token (15 minutes)**
- Short-lived JWT token
- Used for API requests (Authorization header)
- Stored in memory only (cleared on app refresh/restart)
- If compromised, limited exposure window
- Must be validated on every API call

**Refresh Token (7 days)**
- Long-lived token
- Stored in HTTP-only secure cookies (cannot be accessed by JavaScript)
- Used only to obtain new access tokens
- Rotated on each refresh for forward secrecy
- Can be revoked/blacklisted on logout

### Why Two Tokens?

| Aspect | Access Token | Refresh Token |
|--------|--------------|---------------|
| **Lifetime** | 15 minutes | 7 days |
| **Usage** | API calls | Token refresh |
| **Storage** | Memory | HTTP-only cookie |
| **XSS Risk** | Low (in memory) | None (HTTP-only) |
| **CSRF Risk** | Low (header-based) | Mitigated (SameSite) |
| **Revocation** | Immediate | On logout |

---

## Token Types & Expiration

### Access Token (JWT)

```typescript
// Access Token Payload
{
  userId: "user_123",
  email: "user@example.com",
  type: "access",           // Token type identifier
  iat: 1708454400,          // Issued at (Unix timestamp)
  exp: 1708454400 + 900,    // Expiration (15 minutes later)
}
```

**Characteristics:**
- ✓ Expires in 15 minutes
- ✓ Contains user info (userId, email)
- ✓ Signed with server secret (JWT_SECRET)
- ✓ Sent in Authorization: Bearer header
- ✓ Validated on every API request
- ✓ Not stored persistently

**Security:**
- Cannot be refreshed directly - must use refresh token
- If stolen, attacker has access for max 15 minutes
- Stored in memory = cleared on page refresh/app restart
- XSS cannot extract it from httpOnly cookies

### Refresh Token (JWT)

```typescript
// Refresh Token Payload
{
  userId: "user_123",
  type: "refresh",          // Token type identifier
  iat: 1708454400,
  exp: 1708454400 + 604800, // Expiration (7 days later)
}
```

**Characteristics:**
- ✓ Expires in 7 days
- ✓ Contains only userId (no sensitive data)
- ✓ Signed with different secret (JWT_REFRESH_SECRET)
- ✓ Stored in HTTP-only secure cookie
- ✓ Used only for token refresh requests
- ✓ Rotated on each use (optional but recommended)

**Security:**
- HTTP-only = cannot be accessed by JavaScript (immune to XSS)
- Secure flag = HTTPS only
- SameSite=Strict = CSRF protection
- Limited scope = only used for token refresh
- Can be blacklisted/revoked on logout

---

## Token Flow Diagrams

### Login Flow

```
User Application
  |
  +-- POST /auth/login
      (email, password)
  |
  v
Server Application
  |
  +-- 1. Validate credentials
  |   2. Hash password with argon2
  |   3. Generate accessToken (JWT, 15min)
  |   4. Generate refreshToken (JWT, 7d)
  |
  v
Response:
{
  accessToken: "eyJhbGci...",
  expiresIn: 900,
  userId: "user_123",
  email: "user@example.com"
}
+ Set-Cookie: refreshToken=eyJhbGci... (httpOnly, secure, sameSite)
  |
  v
Client:
  - Store accessToken in memory
  - Browser stores refreshToken cookie
  - Navigate to home screen
```

### API Request Flow (with valid token)

```
User Application
  |
  +-- GET /api/posts
      Authorization: Bearer <accessToken>
  |
  v
Server:
  |
  +-- 1. Extract token from header
  |   2. Check if blacklisted? (if logout occurred)
  |   3. Verify JWT signature (using JWT_SECRET)
  |   4. Check expiration (not expired?)
  |   5. Verify type === 'access'
  |   6. Extract userId from payload
  |
  v
Success:
  Attach user to request, call next handler
  Handler can use req.user.userId
  Return 200 with posts
```

### Token Refresh Flow (token expired)

```
User Application
  |
  +-- ensureValidToken() checks expiration
  |   Token expired! Need to refresh
  |
  +-- POST /auth/refresh
      (no body, refreshToken in cookie)
      credentials: 'include' (sends cookies)
  |
  v
Server:
  |
  +-- 1. Extract refreshToken from cookie
  |   2. Check if blacklisted?
  |   3. Verify JWT signature (using JWT_REFRESH_SECRET)
  |   4. Check expiration (7 days not passed?)
  |   5. Verify type === 'refresh'
  |   6. Generate new accessToken
  |   7. Optional: Rotate refreshToken
  |
  v
Response:
{
  accessToken: "new_eyJhbGci...",
  expiresIn: 900
}
+ Set-Cookie: (optional) new refreshToken
  |
  v
Client:
  - Update memory with new accessToken
  - Browser updates cookie with new refreshToken (if rotated)
  - Retry original API request with new token
```

### Logout Flow (token revocation)

```
User clicks Logout
  |
  v
Client Application
  |
  +-- logout(accessToken)
      POST /auth/logout
      Authorization: Bearer <accessToken>
      credentials: 'include' (send refreshToken cookie)
  |
  v
Server:
  |
  +-- 1. Verify accessToken (as normal)
  |   2. Extract both tokens:
  |      - accessToken from Authorization header
  |      - refreshToken from cookie
  |   3. Add BOTH to blacklist/revocation set
  |   4. Clear refreshToken cookie
  |   5. Log logout event
  |
  v
Response:
{
  success: true,
  message: "Logged out successfully"
}
  |
  v
Client:
  - Clear memory accessToken
  - Browser clears cookie automatically
  - Clear app state (currentUser, etc)
  - Navigate to login screen
  |
  v
If attacker tries to use old tokens:
  - POST /auth/refresh with old cookie → Blacklist check fails → 401
  - GET /api/posts with old header → Blacklist check fails → 401
```

---

## Implementation Guide

### 1. Backend Setup

#### Install Dependencies

```bash
npm install jsonwebtoken cookie-parser express
```

#### Environment Variables (.env)

```env
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_access_token_secret_min_32_chars_here
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars_here

# Token Expiration
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

#### Backend Authentication Middleware Example

See [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts) for full implementation:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware to validate access token
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.substring(7); // Remove "Bearer "
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token' });
    }

    // Check blacklist
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ success: false, error: 'Token revoked' });
    }

    // Verify signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Verify it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
```

#### Login Endpoint

```typescript
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate credentials
  const user = await db.users.findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // 2. Verify password (using argon2)
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  // 3. Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // 4. Send tokens
  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,        // HTTPS only
      sameSite: 'strict',  // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        accessToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
});
```

#### Refresh Endpoint

```typescript
app.post('/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken || isTokenBlacklisted(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});
```

#### Logout Endpoint

```typescript
app.post('/auth/logout', authMiddleware, (req, res) => {
  const { authorization } = req.headers;
  const refreshToken = req.cookies.refreshToken;

  // Add both tokens to blacklist
  if (authorization) {
    const accessToken = authorization.substring(7);
    blacklistToken(accessToken, 900);    // 15 min
  }
  if (refreshToken) {
    blacklistToken(refreshToken, 604800); // 7 days
  }

  // Clear cookie
  res.clearCookie('refreshToken');

  res.json({ success: true, message: 'Logged out' });
});
```

### 2. Client Implementation

#### Token Manager (utils/tokenManager.ts)

See [tokenManager.ts](./tokenManager.ts) for full implementation:

```typescript
// Store access token in memory (cleared on app restart)
let currentAccessToken: string | null = null;

export function setAccessToken(token: string) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  if (!currentAccessToken || isTokenExpired(currentAccessToken)) {
    currentAccessToken = null;
    return null;
  }
  return currentAccessToken;
}

// Check token expiration
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - 5 <= now; // 5 second buffer
}

// Automatic refresh on token expiration
export async function ensureValidToken(): Promise<boolean> {
  const token = getAccessToken();
  
  if (!token) return false;
  if (!isTokenExpired(token)) return true;

  // Token expired, refresh it
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Send cookies
  });

  if (response.ok) {
    const { accessToken } = await response.json();
    setAccessToken(accessToken);
    return true;
  }

  return false;
}

// Make authenticated API calls
export async function authenticatedFetch(url: string, options = {}) {
  // Ensure token is valid (refresh if needed)
  const isValid = await ensureValidToken();
  if (!isValid) throw new Error('Not authenticated');

  const token = getAccessToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers, credentials: 'include' });
}
```

#### Login Integration

```typescript
import { setAccessToken } from '@/utils/tokenManager';
import { login } from '@/utils/authentication';

async function handleLogin(email: string, password: string) {
  const response = await login({ email, password });

  if (response.success) {
    // Store access token in memory
    setAccessToken(response.data.accessToken);
    
    // Refresh token is automatically stored in httpOnly cookie
    // (no client-side action needed)

    // Update app state
    updateAuthState({
      isLoggedIn: true,
      userId: response.data.userId,
      email: response.data.email,
    });

    navigate('/home');
  }
}
```

#### API Calls with Auto-Refresh

```typescript
import { authenticatedFetch } from '@/utils/tokenManager';

// Simple API call with automatic token refresh
async function getPosts() {
  try {
    const response = await authenticatedFetch('/api/posts');
    return await response.json();
  } catch (error) {
    // Token refresh failed, user not authenticated
    logout();
  }
}

// If token expires during request:
// 1. authenticatedFetch detects expired token
// 2. Calls POST /auth/refresh automatically
// 3. Server returns new accessToken
// 4. Client retries request with new token
// 5. User doesn't notice the refresh
```

#### Logout

```typescript
import { logout } from '@/utils/authentication';
import { clearAccessToken } from '@/utils/tokenManager';

async function handleLogout() {
  // Backend revokes both tokens
  await logout(getAccessToken());

  // Clear client state
  clearAccessToken();
  updateAuthState({ isLoggedIn: false, userId: null });

  navigate('/login');
}
```

---

## Security Best Practices

### ✅ DO

#### Token Generation & Signing

- [x] Use strong secrets (min 32 random characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [x] Use different secrets for access vs refresh tokens
  ```typescript
  const accessSecret = process.env.JWT_SECRET;      // For access tokens
  const refreshSecret = process.env.JWT_REFRESH_SECRET; // For refresh tokens
  ```

- [x] Sign tokens with HMAC-SHA256 or RS256 (asymmetric)
  ```typescript
  jwt.sign(payload, secret, { algorithm: 'HS256' }); // HMAC
  jwt.sign(payload, privateKey, { algorithm: 'RS256' }); // RSA
  ```

- [x] Include token type in payload
  ```typescript
  { userId, type: 'access' } // vs { userId, type: 'refresh' }
  ```

#### Token Expiration

- [x] Keep access tokens short-lived (15-30 minutes)
- [x] Use reasonable refresh token expiration (7-30 days)
- [x] Validate expiration on every request
- [x] Add 5-second buffer before expiry to prevent race conditions

#### Storage

- [x] Store access tokens in memory only (no persistence)
- [x] Store refresh tokens in HTTP-only cookies
- [x] Set secure flag on cookies (HTTPS only)
- [x] Set SameSite=Strict for CSRF protection

#### Token Validation

- [x] Verify JWT signature on every protected request
- [x] Check token type matches endpoint (access vs refresh)
- [x] Validate token expiration
- [x] Check token against blacklist/revocation on logout
- [x] Use different secrets for different token types

#### Refresh Token Rotation

- [x] Generate new refresh token on each use (optional but recommended)
- [x] Invalidate old refresh token when new one issued
- [x] Limits exposure if refresh token compromised

#### Logout & Revocation

- [x] Add both tokens to blacklist on logout
- [x] Clear refresh token cookie on logout
- [x] Blacklist tokens in Redis (TTL = token lifetime)
- [x] Log logout events for audit trail

#### Error Handling

- [x] Return generic error messages (no implementation details)
- [x] Don't reveal whether token is expired vs invalid
- [x] Log actual errors server-side
- [x] Return 401 for auth failures, not 403

#### HTTPS/TLS

- [x] Always use HTTPS in production
- [x] Set secure flag on cookies
- [x] Use TLS 1.2 or higher
- [x] Implement certificate pinning (optional)

### ❌ DON'T

#### Token Storage

- [ ] Don't store access tokens in localStorage
- [ ] Don't store access tokens in AsyncStorage (Expo)
- [ ] Don't store tokens in plain state
- [ ] Don't expose tokens in logs or error messages

#### Token Handling

- [ ] Don't accept tokens without signature verification
- [ ] Don't use weak signing algorithms (MD5, SHA1)
- [ ] Don't extend token expiration on each request
- [ ] Don't send tokens in URLs or query parameters
- [ ] Don't send refresh tokens in Authorization header

#### Cookie Configuration

- [ ] Don't allow JavaScript to access refresh token (must be httpOnly)
- [ ] Don't send cookies over HTTP (must be secure)
- [ ] Don't skip SameSite protection (enables CSRF)
- [ ] Don't set excessive cookie lifetime

#### Refresh Logic

- [ ] Don't refresh tokens that aren't actually expired
- [ ] Don't use same secret for access and refresh tokens
- [ ] Don't send refresh token in response body
- [ ] Don't allow multiple simultaneous refresh requests

#### Password Handling

- [ ] Don't hash passwords on client (hash on server only)
- [ ] Don't store plain passwords anywhere
- [ ] Don't send passwords in bearer tokens
- [ ] Don't log passwords ever

---

## Common Vulnerabilities & Prevention

### 1. XSS Attack (Accessing Token from localStorage)

**Vulnerability:** Attacker injects script that steals token from localStorage

**Prevention:**
- ✓ Don't use localStorage for access tokens
- ✓ Use memory storage for access tokens (cleared on refresh)
- ✓ Use HTTP-only cookies for refresh tokens (JavaScript cannot access)
- ✓ Implement Content Security Policy (CSP) headers

**CSP Header Example:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self' unsafe-inline;
  img-src 'self' https:;
  connect-src 'self' https://api.yourdomain.com
```

### 2. CSRF Attack (Cross-Site Request Forgery)

**Vulnerability:** Attacker tricks user into making request with their token

**Prevention:**
- ✓ Use SameSite=Strict on refresh token cookies
- ✓ Include CSRF token in session requests
- ✓ Validate origin and referer headers
- ✓ Use POST instead of GET for state-changing operations

**Cookie Security:**
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,        // HTTPS only
  sameSite: 'strict',  // Blocks cross-site cookies
});
```

### 3. Token Compromise (Stolen Token)

**Vulnerability:** Attacker obtains token (XSS, memory dump, etc)

**Prevention:**
- ✓ Keep access tokens short-lived (15m max exposure)
- ✓ Implement token rotation (new token on each refresh)
- ✓ Use refresh tokens for re-authentication
- ✓ Implement token blacklist on logout
- ✓ Monitor for suspicious activity

**Token Lifetime Strategy:**
```
Access Token: 15 minutes (limited damage window)
Refresh Token: 7 days (user convenience)
Session: Can be extended with refresh tokens
Logout: Immediate revocation of both tokens
```

### 4. Token Replay Attack

**Vulnerability:** Attacker reuses expired or captured token

**Prevention:**
- ✓ Always validate token expiration
- ✓ Use token version/jti (JWT ID) for tracking
- ✓ Implement token blacklist for revoked tokens
- ✓ Use nonce for one-time use scenarios
- ✓ Implement TLS to prevent token capture

**Token Validation Checklist:**
```typescript
const validChecks = [
  jwt.verify(token, secret),        // Signature valid
  decoded.exp > now,                // Not expired
  decoded.type === 'access',        // Correct type
  !isBlacklisted(token),            // Not revoked
  decoded.userId === currentUser,   // Belongs to current user (optional)
];
```

### 5. Broken Authentication (Weak Secrets)

**Vulnerability:** Weak JWT secrets can be brute-forced

**Prevention:**
- ✓ Use cryptographically random secrets (min 32 bytes)
- ✓ Use separate secrets for different purposes
- ✓ Rotate secrets periodically (complex but advisable)
- ✓ Never commit secrets to version control
- ✓ Use environment variables for all secrets

**Secret Generation:**
```bash
# Generate strong random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
```

### 6. Token Fixation (Session Fixation)

**Vulnerability:** Attacker tricks user into using attacker's token

**Prevention:**
- ✓ Generate new tokens on login
- ✓ Rotate tokens periodically (refresh flow)
- ✓ Validate token ownership
- ✓ Implement device fingerprinting (optional)
- ✓ Add user-agent validation (optional)

---

## Troubleshooting

### Issue: "Token Expired" error after 15 minutes of inactivity

**Cause:** Access token expired, refresh token also expired, or not properly rotated

**Solutions:**
1. Check if refresh token expiration is 7 days (not 15m)
2. Verify token refresh endpoint is working
3. Ensure `ensureValidToken()` is called before API requests
4. Check if refresh token cookie is being sent with credentials

### Issue: Access token not being automatically refreshed

**Cause:** ensureValidToken() not called, or refresh endpoint not implemented

**Solutions:**
```typescript
// Ensure ensureValidToken() is called before EVERY API request
async function authenticatedFetch(url, options) {
  const isValid = await ensureValidToken(); // Must be called!
  if (!isValid) throw new Error('Not authenticated');
  
  const token = getAccessToken();
  // ... make request
}
```

### Issue: Logout not working, user can still access resources

**Cause:** Tokens not being blacklisted, or blacklist cleared

**Solutions:**
1. Implement persistent blacklist (Redis, database)
2. Verify both tokens being added to blacklist
3. Check blacklist is checked on every request
4. Ensure refresh token cookie is cleared

**Redis Implementation:**
```typescript
const redis = require('redis');
const client = redis.createClient();

async function blacklistToken(token, expiresIn) {
  await client.setex(`blacklist:${token}`, expiresIn, 'true');
}

async function isBlacklisted(token) {
  const result = await client.get(`blacklist:${token}`);
  return result !== null;
}
```

### Issue: Refresh token not being sent to refresh endpoint

**Cause:** Cookie not being sent (credentials option missing)

**Solutions:**
```typescript
// CORRECT - sends cookies
await fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include', // MUST include this!
  headers: { 'Content-Type': 'application/json' },
});

// WRONG - doesn't send cookies
await fetch('/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // Missing credentials: 'include'
});
```

### Issue: "Invalid token type" error

**Cause:** Using refresh token in Authorization header (should only be in cookies)

**Solutions:**
1. Verify access tokens have `type: 'access'` in payload
2. Verify refresh tokens have `type: 'refresh'` in payload
3. Never send refresh token in Authorization header
4. Refresh endpoint should extract from cookies only

### Issue: CORS errors when calling /auth/refresh

**Cause:** credentials: 'include' not allowed by CORS policy

**Solutions:**
```javascript
// Server-side Express CORS setup
const cors = require('cors');

app.use(cors({
  origin: 'https://yourfrontend.com', // Specific origin
  credentials: true,                   // Allow credentials
}));

// Client-side
fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include', // Must send credentials
  headers: { 'Content-Type': 'application/json' },
});
```

---

## Implementation Checklist

### Backend Setup
- [ ] Install jsonwebtoken, cookie-parser, express
- [ ] Set JWT_SECRET and JWT_REFRESH_SECRET in .env
- [ ] Implement authMiddleware
- [ ] Implement login endpoint (generates both tokens)
- [ ] Implement refresh endpoint (returns new access token)
- [ ] Implement logout endpoint (blacklists both tokens)
- [ ] Set up Redis or persistent blacklist storage
- [ ] Implement rate limiting on login endpoint
- [ ] Add HTTPS and secure cookie settings
- [ ] Implement error handling and logging

### Client Setup
- [ ] Create tokenManager.ts with token storage functions
- [ ] Update authentication.ts with logout function
- [ ] Implement authenticatedFetch() wrapper
- [ ] Add ensureValidToken() before API calls
- [ ] Store access token in memory (getAccessToken, setAccessToken)
- [ ] Handle token refresh gracefully
- [ ] Clear tokens on logout
- [ ] Test token expiration and refresh flow
- [ ] Test logout and token blacklisting
- [ ] Test API calls with expired and invalid tokens

### Security Hardening
- [ ] Enable HTTPS (secure flag on cookies)
- [ ] Set SameSite=Strict on refresh cookies
- [ ] Implement Content Security Policy headers
- [ ] Add rate limiting to auth endpoints
- [ ] Implement account lockout after failed attempts
- [ ] Add logging/monitoring for auth events
- [ ] Implement token rotation on refresh (optional)
- [ ] Set maximum token lifetime (7 days for refresh)
- [ ] Validate token signature on every request
- [ ] Check token blacklist on every request

### Testing
- [ ] Test successful login flow
- [ ] Test token refresh after expiration
- [ ] Test API call with valid token
- [ ] Test API call with expired token (should auto-refresh)
- [ ] Test API call with invalid token (should fail)
- [ ] Test logout blacklists both tokens
- [ ] Test cannot reuse tokens after logout
- [ ] Test refresh endpoint with blacklisted token
- [ ] Test CORS and credentials flow
- [ ] Test error messages don't leak information

---

## Related Files

- [tokenManager.ts](./tokenManager.ts) - Client-side token management
- [authentication.ts](./authentication.ts) - Registration, login, logout functions
- [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts) - Backend middleware examples
- [BACKEND_AUTH_EXAMPLE.ts](./BACKEND_AUTH_EXAMPLE.ts) - Backend endpoint examples

---

## References

- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JWT Specification](https://tools.ietf.org/html/rfc7519)
- [Auth0 JWT Security](https://auth0.com/learn/json-web-tokens/)
- [Secure Cookie Flags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

