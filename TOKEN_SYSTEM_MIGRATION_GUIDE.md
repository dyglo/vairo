# JWT Token System Migration Guide

**Last Updated:** February 17, 2026  
**Status:** Ready for Integration  
**Changes:** Access tokens (15m) + Refresh tokens (7d) + Token revocation

---

## What Changed

### Before: Simple JWT Tokens
- Single token (7-day expiration)
- Stored in AsyncStorage
- No automatic refresh
- No token revocation

### After: Dual Token System
- **Access Token** (15m): Memory-only, auto-refreshed, limited exposure
- **Refresh Token** (7d): HTTP-only cookies, secure, revocable
- **Automatic Refresh**: Transparent token refresh on expiration
- **Revocation**: Complete logout with token blacklist

---

## New Files Created

### 1. `utils/tokenManager.ts` (450 lines)

Manages access token lifecycle in memory and refresh token in cookies.

**Key Functions:**
- `setAccessToken(token)` - Store in memory
- `getAccessToken()` - Retrieve from memory (checks expiration)
- `isTokenExpired(token)` - Check if token expired
- `decodeToken(token)` - Parse JWT payload (no verification)
- `refreshAccessToken()` - POST /auth/refresh
- `ensureValidToken()` - Auto-refresh if expired
- `authenticatedFetch(url, options)` - API wrapper with auto-refresh
- `logout()` - POST /auth/logout
- `isAuthenticated()` - Check if user logged in
- `getCurrentUser()` - Get stored user info from token

**Usage:**
```typescript
import { setAccessToken, authenticatedFetch } from '@/utils/tokenManager';

// After login
setAccessToken(response.data.accessToken);

// Make API calls (auto-refreshes token if expired)
const posts = await authenticatedFetch('/api/posts');
```

### 2. `utils/BACKEND_AUTH_MIDDLEWARE.ts` (500 lines)

Backend middleware examples for token validation and protected routes.

**Key Functions:**
- `authMiddleware(req, res, next)` - Validates access token
- `generateAccessToken(userId, email)` - Generate 15m JWT
- `generateRefreshToken(userId)` - Generate 7d JWT
- `loginHandler(req, res)` - Generate both tokens
- `refreshTokenHandler(req, res)` - Issue new access token
- `logoutHandler(req, res)` - Revoke tokens
- `blacklistToken(token, expiresIn)` - Add to revocation list
- `isTokenBlacklisted(token)` - Check revocation

**Usage (Express.js):**
```typescript
import { authMiddleware, loginHandler, refreshTokenHandler, logoutHandler } from './BACKEND_AUTH_MIDDLEWARE';

app.post('/auth/login', loginHandler);
app.post('/auth/refresh', refreshTokenHandler);
app.post('/auth/logout', authMiddleware, logoutHandler);
app.get('/api/posts', authMiddleware, getPostsHandler);
```

### 3. `JWT_SECURITY_GUIDE.md` (600 lines)

Complete JWT security documentation covering:
- Token strategy and expiration
- Token flow diagrams (login, refresh, logout)
- Backend setup and middleware
- Client implementation
- Security best practices
- Common vulnerabilities and prevention
- Troubleshooting

---

## Integration Steps

### Phase 1: Client Updates (Required)

#### 1.1 Update Login Handler

```typescript
import { setAccessToken } from '@/utils/tokenManager';
import { login } from '@/utils/authentication';

async function handleLogin(email: string, password: string) {
  const response = await login({ email, password });

  if (response.success) {
    const { accessToken, userId, email } = response.data;

    // Store access token in memory
    setAccessToken(accessToken);

    // Refresh token automatically stored in httpOnly cookie
    // (no client-side action needed, browser handles it)

    // Update app state
    applyAuthContext({
      isLoggedIn: true,
      currentUser: { userId, email },
    });

    navigate('/home');
  } else {
    showError(response.error?.message);
  }
}
```

#### 1.2 Update API Calls

```typescript
// OLD (before)
const response = await fetch('/api/posts', {
  headers: { 'Authorization': `Bearer ${token}` },
});

// NEW (after) - with automatic token refresh
import { authenticatedFetch } from '@/utils/tokenManager';

const response = await authenticatedFetch('/api/posts');
// - Automatically checks token expiration
// - Refreshes token if expired
// - Sends request with new token
// - User doesn't notice the delay
```

#### 1.3 Update Logout Handler

```typescript
// OLD (before)
async function logout() {
  AsyncStorage.removeItem('auth_token');
  updateAuthState({ isLoggedIn: false });
}

// NEW (after)
import { logout as logoutAuth } from '@/utils/authentication';
import { clearAccessToken } from '@/utils/tokenManager';

async function handleLogout() {
  const token = getAccessToken();
  
  // Backend revokes both tokens
  await logoutAuth(token);

  // Clear client state
  clearAccessToken();
  updateAuthState({ isLoggedIn: false, currentUser: null });

  navigate('/login');
}
```

#### 1.4 Update App Context

```typescript
// AppContext.tsx
import { isAuthenticated, getAccessToken } from '@/utils/tokenManager';

// On app startup
useEffect(() => {
  // Check if user still authenticated
  const token = getAccessToken();
  
  if (token) {
    // Try to verify token with server
    verifyToken(token).then((response) => {
      if (response.success) {
        setAuthState({
          isLoggedIn: true,
          currentUser: { userId: response.data.userId },
        });
      } else {
        // Token invalid/expired, logout
        handleLogout();
      }
    });
  }
}, []);
```

### Phase 2: Backend Updates (Required)

#### 2.1 Install Dependencies

```bash
npm install jsonwebtoken cookie-parser
```

#### 2.2 Environment Variables

Add to `.env`:

```env
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_access_token_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars

# Token Expiration
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

#### 2.3 Update Login Endpoint

See [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts#L150) for full implementation.

```typescript
import { generateAccessToken, generateRefreshToken } from './auth-middleware';

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate credentials & hash password
  const user = await db.users.findByEmail(email);
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 2. Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // 3. Send tokens
  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,   // Cannot be accessed by JavaScript
      secure: true,     // HTTPS only
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

#### 2.4 Add Refresh Endpoint

See [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts#L320) for full implementation.

```typescript
app.post('/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.userId);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

#### 2.5 Add Authentication Middleware

See [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts#L100) for full implementation.

```typescript
import { authMiddleware } from './auth-middleware';

// Protect routes
app.get('/api/posts', authMiddleware, getPostsHandler);
app.post('/api/posts', authMiddleware, createPostHandler);
app.delete('/api/posts/:id', authMiddleware, deletePostHandler);
```

#### 2.6 Add Logout Endpoint

See [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts#L375) for full implementation.

```typescript
app.post('/auth/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.substring(7);
  const refreshToken = req.cookies.refreshToken;

  // Add both tokens to blacklist
  if (token) blacklistToken(token, 900);        // 15 min
  if (refreshToken) blacklistToken(refreshToken, 604800); // 7 days

  // Clear cookie
  res.clearCookie('refreshToken');

  res.json({ success: true, message: 'Logged out' });
});
```

### Phase 3: Storage Setup (Backend)

#### 3.1 In-Memory Blacklist (Development)

```typescript
const tokenBlacklist = new Set<string>();

function blacklistToken(token: string, expiresIn: number) {
  tokenBlacklist.add(token);
}

function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}
```

⚠️ **Warning:** In-memory blacklist clears on server restart. Use Redis for production.

#### 3.2 Redis Blacklist (Production)

```typescript
const redis = require('redis');
const client = redis.createClient();

async function blacklistToken(token: string, expiresIn: number) {
  // Automatically expires after expiresIn seconds
  await client.setex(`blacklist:${token}`, expiresIn, 'true');
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await client.get(`blacklist:${token}`);
  return result !== null;
}
```

---

## Migration Checklist

### Client-Side
- [ ] Import `tokenManager` functions
- [ ] Update login to call `setAccessToken()`
- [ ] Update API calls to use `authenticatedFetch()`
- [ ] Update logout to call `logout()` and `clearAccessToken()`
- [ ] Update AppContext to check `isAuthenticated()`
- [ ] Test token refresh on 401 response
- [ ] Test automatic token refresh after 15 minutes
- [ ] Test logout clears all tokens

### Backend
- [ ] Install jsonwebtoken and cookie-parser
- [ ] Add JWT_SECRET and JWT_REFRESH_SECRET to .env
- [ ] Implement authMiddleware
- [ ] Update login endpoint to return both tokens
- [ ] Add refresh endpoint
- [ ] Add logout endpoint
- [ ] Set up token blacklist (Redis or in-memory)
- [ ] Apply authMiddleware to protected routes
- [ ] Test login flow (both tokens returned)
- [ ] Test refresh flow (new access token)
- [ ] Test logout revokes both tokens
- [ ] Test cannot use token after logout
- [ ] Set secure, httpOnly, sameSite on cookies
- [ ] Enable HTTPS for production

### Testing
- [ ] Login → Receive access token (memory) + refresh token (cookie)
- [ ] API call with valid token → Success
- [ ] API call with expired token → Auto-refresh → Success
- [ ] API call after logout → 401 Unauthorized
- [ ] Refresh with blacklisted token → Fails
- [ ] Close app and reopen → Token cleared from memory
- [ ] Manual token manipulation → Invalid signature error
- [ ] CORS and credentials flow working

---

## API Contract Changes

### Login Response

**Before:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "token": "jwt_token",
    "expiresAt": 1708454400
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "accessToken": "jwt_access_token",
    "expiresIn": 900
  }
}
// Plus Set-Cookie header with refreshToken (httpOnly cookie, not in JSON body)
```

### Refresh Response

**New Endpoint:** POST /auth/refresh

```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 900
  }
}
```

---

## Security Improvements

### Before
- ✗ Single token (7 days) = 7 days of exposure if compromised
- ✗ Stored in AsyncStorage (persistent) = XSS risk
- ✗ No automatic refresh = manual token management
- ✗ No token revocation = logout not immediate

### After
- ✓ Access token lifetime only 15 minutes = limited exposure
- ✓ In memory only = cleared on app restart
- ✓ Automatic refresh = transparent to user
- ✓ Token blacklist = immediate logout
- ✓ Separate secrets = token isolation
- ✓ HTTP-only cookies = immune to XSS
- ✓ Token rotation = forward secrecy
- ✓ Type checking = access vs refresh isolation

---

## Troubleshooting

### Issue: Token not being stored in memory

```typescript
// ❌ Wrong
const token = response.data.token;

// ✅ Correct
import { setAccessToken } from '@/utils/tokenManager';
const { accessToken } = response.data;
setAccessToken(accessToken);
```

### Issue: Refresh token cookie not being sent

```typescript
// ❌ Wrong
await fetch('/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Correct
await fetch('/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // MUST include this!
});
```

### Issue: API calls failing with 401

```typescript
// ❌ Wrong
const response = await fetch('/api/posts', {
  headers: { 'Authorization': `Bearer ${getAccessToken()}` },
});

// ✅ Correct - handles automatic refresh
import { authenticatedFetch } from '@/utils/tokenManager';
const response = await authenticatedFetch('/api/posts');
```

### Issue: Logout not working

```typescript
// ❌ Wrong - only clears client
AsyncStorage.removeItem('token');

// ✅ Correct - revokes on server
import { logout } from '@/utils/authentication';
await logout(getAccessToken());
clearAccessToken();
```

---

## Related Documentation

- [JWT_SECURITY_GUIDE.md](./JWT_SECURITY_GUIDE.md) - Complete JWT security documentation
- [tokenManager.ts](./tokenManager.ts) - Client-side token management implementation
- [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts) - Backend middleware examples
- [authentication.ts](./authentication.ts) - Auth functions (updated with logout)

