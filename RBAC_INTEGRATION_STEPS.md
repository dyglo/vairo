# RBAC Integration with Existing Auth System

Quick reference for integrating Role-Based Access Control with current authentication infrastructure.

---

## Required Changes to Existing Files

### 1. Update `generateAccessToken()` Function

**Location:** `BACKEND_AUTH_MIDDLEWARE.ts`

**Current implementation:**
```typescript
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}
```

**Updated implementation (add role):**
```typescript
export function generateAccessToken(userId: string, email: string, role: string = 'user'): string {
  return jwt.sign(
    {
      userId,
      email,
      role,  // NEW - include role in token
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}
```

---

### 2. Update Login Handler

**Location:** `BACKEND_AUTH_MIDDLEWARE.ts` → `loginHandler()`

**Current implementation:**
```typescript
export async function loginHandler(req: any, res: any): Promise<void> {
  try {
    const { email, password } = req.body;

    // 1. Find user
    // const user = await db.users.findByEmail(email);

    // 2. Verify password
    // const isPasswordValid = await verifyPassword(password, user.passwordHash);

    // 3. Generate token
    // const accessToken = generateAccessToken(user.id, user.email);
    // const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, { ... });
    res.status(200).json({
      success: true,
      data: {
        userId: 'user_id_here',
        email: email.toLowerCase(),
        accessToken: 'jwt_access_token_here',
        expiresIn: 900,
      },
    });
  } catch (error) {
    // error handling
  }
}
```

**Updated implementation (add role to generateAccessToken call):**
```typescript
export async function loginHandler(req: any, res: any): Promise<void> {
  try {
    const { email, password } = req.body;

    // 1. Find user
    // const user = await db.users.findByEmail(email);

    // 2. Verify password
    // const isPasswordValid = await verifyPassword(password, user.passwordHash);

    // 3. Generate tokens WITH ROLE
    // const accessToken = generateAccessToken(user.id, user.email, user.role);  // ADD ROLE
    // const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, { ... });
    res.status(200).json({
      success: true,
      data: {
        userId: 'user_id_here',
        email: email.toLowerCase(),
        accessToken: 'jwt_access_token_here',
        expiresIn: 900,
        role: 'user',  // OPTIONAL: Send to client (read-only)
      },
    });
  } catch (error) {
    // error handling
  }
}
```

---

### 3. Update Auth Middleware

**Location:** `BACKEND_AUTH_MIDDLEWARE.ts` → `authMiddleware()`

**Current implementation:**
```typescript
export function authMiddleware(req: any, res: any, next: any): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authorization token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    if (isTokenBlacklisted(token)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      iat: number;
      exp: number;
      type: 'access';
    };

    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
      });
      return;
    }

    // Attach user info to request
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    // error handling
  }
}
```

**Updated implementation (extract role):**
```typescript
export function authMiddleware(req: any, res: any, next: any): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authorization token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    if (isTokenBlacklisted(token)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;  // NEW - expect role in token
      iat: number;
      exp: number;
      type: 'access';
    };

    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
      });
      return;
    }

    // Attach user info INCLUDING ROLE
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,  // NEW - include role
    };

    next();
  } catch (error: any) {
    // error handling
  }
}
```

---

## Adding RBAC to Routes

### Step 1: Import RBAC Middleware

```typescript
import { 
  roleMiddleware, 
  minimumRoleMiddleware, 
  hasRole,
  hasMinimumRole 
} from './rbac-middleware';
```

### Step 2: Apply to Protected Routes

#### Example 1: Admin-Only Route

**Before (no role check):**
```typescript
app.delete('/api/admin/users/:id', authMiddleware, deleteUserHandler);
```

**After (with role check):**
```typescript
app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), deleteUserHandler);
//                                              ↑ Add this middleware
```

#### Example 2: Multiple Roles

**Before:**
```typescript
app.patch('/api/posts/:id/status', authMiddleware, updatePostStatusHandler);
```

**After:**
```typescript
app.patch('/api/posts/:id/status', authMiddleware, roleMiddleware(['moderator', 'admin']), updatePostStatusHandler);
//                                              ↑ Allow moderators and admins
```

#### Example 3: Hierarchical Check

**Before:**
```typescript
app.get('/api/moderation/queue', authMiddleware, getModerationQueueHandler);
```

**After:**
```typescript
app.get('/api/moderation/queue', authMiddleware, minimumRoleMiddleware('moderator'), getModerationQueueHandler);
//                                              ↑ Moderators and admins only
```

#### Example 4: Inline Check

**Before:**
```typescript
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json({ success: true, data: user });
});
```

**After:**
```typescript
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  
  // NEW: Check ownership or admin privilege
  if (req.user.userId !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Cannot view other users\' profiles',
      },
    });
  }
  
  const user = await db.users.findById(userId);
  res.json({ success: true, data: user });
});
```

---

## User Model Changes

### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'moderator' | 'admin';  // NEW
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isSuspended?: boolean;
}
```

### Database Schema

```sql
-- PostgreSQL
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('user', 'moderator', 'admin'));
CREATE INDEX idx_users_role ON users(role);

-- MySQL
ALTER TABLE users ADD COLUMN role ENUM('user', 'moderator', 'admin') DEFAULT 'user' NOT NULL;
CREATE INDEX idx_users_role ON users(role);
```

---

## Testing the Integration

### Test 1: Verify Role is in JWT

```typescript
// Login as a user
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com', password: 'pass' }),
});

const { accessToken } = await loginResponse.json();

// Decode token (on backend, for testing)
const decoded = jwt.verify(accessToken, JWT_SECRET);
console.log(decoded.role); // Should print 'user', 'moderator', or 'admin'
```

### Test 2: User Cannot Access Admin Route

```typescript
const response = await fetch('/api/admin/users', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${userToken}` },
});

console.log(response.status); // Should be 403
const body = await response.json();
console.log(body.error.code); // Should be 'FORBIDDEN'
```

### Test 3: Admin Can Access Admin Route

```typescript
const response = await fetch('/api/admin/users', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${adminToken}` },
});

console.log(response.status); // Should be 200
```

### Test 4: Moderator Can Access Moderation Route

```typescript
const response = await fetch('/api/moderation/queue', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${moderatorToken}` },
});

console.log(response.status); // Should be 200
```

---

## Complete Implementation Checklist

### Backend Setup
- [ ] Install and import RBAC middleware
- [ ] Update User model with role field
- [ ] Create database migration (ALTER TABLE users ADD COLUMN role)
- [ ] Update generateAccessToken() to include role parameter
- [ ] Update loginHandler() to pass user.role to generateAccessToken()
- [ ] Update authMiddleware() to extract role from JWT
- [ ] Create audit_logs table (optional but recommended)
- [ ] Update refreshTokenHandler() to preserve role (if needed)

### Route Protection
- [ ] Identify admin-only routes
- [ ] Identify moderator+ routes
- [ ] Identify user-ownership routes
- [ ] Apply roleMiddleware to admin routes
- [ ] Apply roleMiddleware to moderator routes
- [ ] Add inline checks for ownership validation
- [ ] Test each protected route with different roles

### Testing
- [ ] Test login includes role in JWT
- [ ] Test regular user gets 403 on admin routes
- [ ] Test admin gets 200 on admin routes
- [ ] Test moderator gets 403 on admin routes
- [ ] Test moderator gets 200 on moderator routes
- [ ] Test role-based error responses (403 vs 401)
- [ ] Verify audit logs created for privileged actions

### Documentation
- [ ] Document role permissions
- [ ] Document which routes are protected
- [ ] Document RBAC implementation
- [ ] Provide examples for team
- [ ] Document error codes and meanings

---

## Common Mistakes to Avoid

❌ **Mistake 1:** Checking role on client

```typescript
// WRONG - on client side
if (user.role === 'admin') {  // User can fake this!
  showAdminPanel();
}
```

✅ **Correct:** Trust server, let it deny access

```typescript
// RIGHT - client is simple, server validates
showMenuItem('admin-panel');  // If denied, server returns 403
```

---

❌ **Mistake 2:** Forgetting role validation

```typescript
// WRONG - no role check
app.delete('/api/admin/users/:id', authMiddleware, deleteUserHandler);
// Any authenticated user can delete!
```

✅ **Correct:** Always add role middleware

```typescript
// RIGHT
app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), deleteUserHandler);
```

---

❌ **Mistake 3:** Wrong HTTP status code

```typescript
// WRONG
if (!hasRole(user, 'admin')) {
  res.status(401).json({ error: 'Unauthorized' });  // Wrong! 401 is for auth, not roles
}
```

✅ **Correct:** Use 403 for permissions

```typescript
// RIGHT
if (!hasRole(user, 'admin')) {
  res.status(403).json({ error: 'Forbidden' });  // Correct for insufficient permissions
}
```

---

❌ **Mistake 4:** Trusting client role

```typescript
// WRONG - client sends role in request
const role = req.body.role;  // User can lie about their role!
```

✅ **Correct:** Always use JWT payload

```typescript
// RIGHT - role comes from verified JWT token
const role = req.user.role;  // Extracted by authMiddleware from token
```

---

## Summary

To add RBAC to your existing system:

1. **Add role field** to User model (String enum: 'user' | 'moderator' | 'admin')
2. **Update generateAccessToken()** to include role parameter
3. **Update loginHandler()** to pass user.role when generating token
4. **Update authMiddleware()** to extract role from JWT payload
5. **Import RBAC middleware** from BACKEND_RBAC_MIDDLEWARE.ts
6. **Apply roleMiddleware()** to protected routes
7. **Test everything** - auth still works, role checks work, proper error codes

The system is now backward compatible while adding role-based access control.

