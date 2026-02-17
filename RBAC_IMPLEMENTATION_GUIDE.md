# Role-Based Access Control (RBAC) Implementation Guide

**Date:** February 17, 2026  
**Status:** Production-Ready  
**Scope:** Backend authorization only

---

## Overview

Role-Based Access Control allows you to:
- Assign users to roles (user, moderator, admin)
- Restrict endpoints to specific roles
- Implement hierarchical permissions
- Audit privileged actions
- Return proper HTTP status codes (403 Forbidden for insufficient permissions)

---

## Role Hierarchy

### User (Default)
- Regular user account
- Can view profiles, create posts, like content
- Can only edit/delete own content
- Cannot moderate other users

### Moderator
- Can manage content and comments
- Can warn or suspend users
- Can view moderation logs
- Inherits all User permissions

### Admin
- Full system access
- Can manage users and roles
- Can change system settings
- Can view analytics and logs
- Inherits all Moderator and User permissions

---

## User Model

### Schema

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'moderator' | 'admin';  // NEW FIELD
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isSuspended: boolean;
}
```

### Database Migration

```sql
-- PostgreSQL example
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('user', 'moderator', 'admin'));
CREATE INDEX idx_users_role ON users(role);

-- Add audit_logs table for tracking admin actions
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## Backend Implementation

### Step 1: Update JWT Token Generation

In your login endpoint, include the role in the JWT payload:

```typescript
import { generateAccessToken } from './auth-middleware';

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate credentials
  const user = await db.users.findByEmail(email);
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 2. Generate tokens with role
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.role  // INCLUDE ROLE
  );

  const refreshToken = generateRefreshToken(user.id);

  // 3. Send tokens
  res
    .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        accessToken,
        expiresIn: 900,
        role: user.role,  // Can send to client (read-only)
      },
    });
});
```

### Step 2: Update Token Generation Functions

Modify `generateAccessToken` to accept and include role:

```typescript
// BACKEND_AUTH_MIDDLEWARE.ts

export function generateAccessToken(userId: string, email: string, role: string = 'user'): string {
  return jwt.sign(
    {
      userId,
      email,
      role,  // NEW
      type: 'access',
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}
```

### Step 3: Update Auth Middleware to Extract Role

```typescript
// Update authMiddleware to include role

function authMiddleware(req: any, res: any, next: any): void {
  try {
    const token = req.headers.authorization?.substring(7);
    
    if (!token) {
      res.status(401).json({ success: false, error: 'No token' });
      return;
    }

    if (isTokenBlacklisted(token)) {
      res.status(401).json({ success: false, error: 'Token revoked' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'access') {
      res.status(401).json({ success: false, error: 'Invalid token type' });
      return;
    }

    // Attach user info INCLUDING ROLE
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,  // NEW
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
```

### Step 4: Apply RBAC to Routes

#### Admin-Only Endpoint

```typescript
import { roleMiddleware } from './rbac-middleware';

// Delete user (admin only)
app.delete('/api/admin/users/:id', 
  authMiddleware, 
  roleMiddleware('admin'),  // Add RBAC
  async (req, res) => {
    const targetUserId = req.params.id;
    
    // Audit log
    await db.auditLogs.create({
      adminId: req.user.userId,
      action: 'delete_user',
      targetId: targetUserId,
      timestamp: new Date(),
    });
    
    // Delete user
    await db.users.delete(targetUserId);
    
    res.json({ success: true, message: 'User deleted' });
  }
);
```

#### Multiple Roles Allowed

```typescript
// Disable post (moderator or admin)
app.patch('/api/moderation/posts/:id/status',
  authMiddleware,
  roleMiddleware(['moderator', 'admin']),  // Allow multiple roles
  async (req, res) => {
    const postId = req.params.id;
    const { status, reason } = req.body;
    
    // Audit log
    await db.auditLogs.create({
      adminId: req.user.userId,
      action: 'moderate_post',
      targetId: postId,
      reason: reason,
      timestamp: new Date(),
    });
    
    // Update post
    await db.posts.update(postId, { status, moderated: true });
    
    res.json({ success: true });
  }
);
```

#### Hierarchical Check

```typescript
import { minimumRoleMiddleware } from './rbac-middleware';

// View moderation dashboard (moderator+ can access)
app.get('/api/moderation/dashboard',
  authMiddleware,
  minimumRoleMiddleware('moderator'),  // Moderators and admins only
  async (req, res) => {
    const stats = await db.getModerationStats();
    res.json({ success: true, data: stats });
  }
);
```

#### Inline Role Check

```typescript
// View user profile (check ownership or admin)
app.get('/api/users/:id',
  authMiddleware,
  async (req, res) => {
    const userId = req.params.id;
    
    // Check: owner or admin
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
  }
);
```

---

## Route Protection Examples

### Admin-Only Routes

These routes should only be accessible to admins:

```typescript
// User Management
app.post('/api/admin/users', authMiddleware, roleMiddleware('admin'), createUserHandler);
app.get('/api/admin/users', authMiddleware, roleMiddleware('admin'), listUsersHandler);
app.patch('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), updateUserHandler);
app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), deleteUserHandler);

// Role Management
app.patch('/api/admin/users/:id/role', authMiddleware, roleMiddleware('admin'), updateUserRoleHandler);

// System Settings
app.get('/api/admin/settings', authMiddleware, roleMiddleware('admin'), getSettingsHandler);
app.patch('/api/admin/settings', authMiddleware, roleMiddleware('admin'), updateSettingsHandler);

// Analytics & Logs
app.get('/api/admin/analytics', authMiddleware, roleMiddleware('admin'), getAnalyticsHandler);
app.get('/api/admin/logs', authMiddleware, roleMiddleware('admin'), getLogsHandler);
```

### Moderator Routes

These routes allow moderators and admins:

```typescript
// Post Moderation
app.patch('/api/moderation/posts/:id/status', authMiddleware, roleMiddleware(['moderator', 'admin']), moderatePostHandler);
app.delete('/api/moderation/posts/:id', authMiddleware, roleMiddleware(['moderator', 'admin']), deletePostHandler);

// Comment Moderation
app.delete('/api/moderation/comments/:id', authMiddleware, roleMiddleware(['moderator', 'admin']), deleteCommentHandler);

// User Management (limited)
app.patch('/api/moderation/users/:id/warn', authMiddleware, roleMiddleware(['moderator', 'admin']), warnUserHandler);
app.patch('/api/moderation/users/:id/suspend', authMiddleware, roleMiddleware(['moderator', 'admin']), suspendUserHandler);

// Moderation Logs
app.get('/api/moderation/logs', authMiddleware, minimumRoleMiddleware('moderator'), getModerationLogsHandler);
```

### Unprotected Routes (No role check needed)

```typescript
// Public routes (no auth middleware)
app.get('/api/posts/trending', trendingPostsHandler);
app.get('/api/posts/:id', getPostHandler);
app.get('/api/users/:id/profile', getUserProfileHandler);

// User routes (auth required, but no role check)
app.post('/api/posts', authMiddleware, createPostHandler);
app.patch('/api/posts/:id', authMiddleware, updateOwnPostHandler);
app.delete('/api/posts/:id', authMiddleware, deleteOwnPostHandler);
```

---

## HTTP Status Codes

### 200 - OK
Request succeeded

### 201 - Created
Resource created successfully

### 400 - Bad Request
Invalid input parameters

### 401 - Unauthorized
- No authentication token
- Invalid token
- Token expired
- User not authenticated

```json
{
  "success": false,
  "error": {
    "code": "NOT_AUTHENTICATED",
    "message": "User not authenticated"
  }
}
```

### 403 - Forbidden
- User authenticated but lacks required permissions
- Role insufficient for action
- Cannot modify another user's content without privilege

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions for this action"
  }
}
```

### 404 - Not Found
Resource doesn't exist

### 410 - Gone
Resource deleted

### 429 - Too Many Requests
Rate limit exceeded

### 500 - Internal Server Error
Server error

---

## Audit Logging

Always log privileged actions:

```typescript
async function logAdminAction(
  adminId: string,
  action: string,
  targetId: string,
  reason?: string
) {
  try {
    await db.auditLogs.create({
      adminId,
      action,
      targetId,
      reason,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Log but don't fail the request
  }
}

// Usage
await logAdminAction(req.user.userId, 'delete_user', userId);
await logAdminAction(req.user.userId, 'promote_user', userId, 'Good moderation');
await logAdminAction(req.user.userId, 'change_setting', 'max_post_length', 'Updated to 5000');
```

---

## Security Best Practices

### ✅ DO

- [x] **Always validate role on backend** - NEVER trust client
- [x] **Include role in JWT token** - Include in payload, signed
- [x] **Check role on every protected endpoint** - Consistent enforcement
- [x] **Log all privileged actions** - Audit trail
- [x] **Use proper HTTP status codes** - 401 for auth, 403 for permissions
- [x] **Validate ownership before allowing edits** - User can't edit others' posts
- [x] **Implement rate limiting** - Prevent abuse of privileged endpoints
- [x] **Require re-authentication for sensitive actions** - Optional, extra security
- [x] **Use database constraints** - Prevent invalid role values

### ❌ DON'T

- [ ] **Don't trust role from client request** - Always use JWT payload
- [ ] **Don't skip role check if user is authenticated** - Different permissions needed
- [ ] **Don't change user role without verification** - Require admin authentication
- [ ] **Don't expose role in error messages** - Security through obscurity
- [ ] **Don't allow role self-assignment** - Only admins can change roles
- [ ] **Don't log passwords or secrets** - Only log action metadata
- [ ] **Don't process old tokens after logout** - Check blacklist
- [ ] **Don't mix authentication (401) with authorization (403)** - Different meanings

---

## Common Implementation Patterns

### Pattern 1: Admin Functions

```typescript
// These should only work if user is admin
const adminActions = [
  'delete_user',
  'change_user_role',
  'disable_feature',
  'change_system_settings',
  'view_all_user_data',
];

// Apply to routes
app.delete('/api/admin/:resource/:id', authMiddleware, roleMiddleware('admin'), adminHandler);
```

### Pattern 2: Moderator Functions

```typescript
// These work if user is moderator or admin
const moderationActions = [
  'remove_post',
  'remove_comment',
  'warn_user',
  'suspend_user',
  'view_moderation_queue',
];

// Apply to routes
app.post('/api/moderation/action', authMiddleware, roleMiddleware(['moderator', 'admin']), moderationHandler);
```

### Pattern 3: User Ownership Check

```typescript
// Combine role check with ownership check
app.patch('/api/posts/:id', authMiddleware, async (req, res) => {
  const post = await db.posts.findById(req.params.id);
  
  // Allow: post owner OR admin
  const isOwner = post.userId === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Cannot modify other users\' posts' });
  }
  
  // Process update
});
```

### Pattern 4: Progressive Disclosure

```typescript
// Show different data based on role
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const user = await db.users.findById(req.params.id);
  
  let responseData = {
    id: user.id,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
  };
  
  // Admin can see additional info
  if (req.user.role === 'admin') {
    responseData.email = user.email;
    responseData.createdAt = user.createdAt;
    responseData.role = user.role;
  }
  
  res.json({ success: true, data: responseData });
});
```

---

## Testing

### Unit Test Example

```typescript
import { hasRole, hasMinimumRole } from './rbac-middleware';

describe('RBAC Functions', () => {
  test('hasRole checks single role', () => {
    const admin = { userId: '1', role: 'admin' };
    expect(hasRole(admin, 'admin')).toBe(true);
    expect(hasRole(admin, 'user')).toBe(false);
  });

  test('hasRole checks multiple roles', () => {
    const mod = { userId: '2', role: 'moderator' };
    expect(hasRole(mod, ['moderator', 'admin'])).toBe(true);
    expect(hasRole(mod, ['admin'])).toBe(false);
  });

  test('hasMinimumRole checks hierarchy', () => {
    const user = { userId: '3', role: 'user' };
    const admin = { userId: '4', role: 'admin' };
    
    expect(hasMinimumRole(admin, 'user')).toBe(true);
    expect(hasMinimumRole(admin, 'moderator')).toBe(true);
    expect(hasMinimumRole(user, 'moderator')).toBe(false);
  });
});
```

### Integration Test Example

```typescript
describe('Protected Endpoints', () => {
  test('Regular user cannot delete other users', async () => {
    const response = await fetch('/api/admin/users/other_user_id', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userToken}` },
    });
    
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  test('Admin can delete users', async () => {
    const response = await fetch('/api/admin/users/user_id', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    
    expect(response.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Issue: User can access admin endpoints

**Causes:**
- Role not included in JWT token
- authMiddleware not extracting role properly
- roleMiddleware not applied to route

**Solution:**
```typescript
// Verify role is in JWT
const decoded = jwt.verify(token, secret);
console.log(decoded.role); // Should be 'admin', 'moderator', or 'user'

// Verify middleware applied
app.patch('/api/admin/settings', authMiddleware, roleMiddleware('admin'), handler);
//                                             ↑ Must be here
```

### Issue: Getting 401 instead of 403

**Cause:** authMiddleware runs before roleMiddleware

**Order matters:**
```typescript
// CORRECT order
app.delete('/api/users/:id', 
  authMiddleware,      // 1. Authenticate (401 if fails)
  roleMiddleware('admin'),  // 2. Check role (403 if fails)
  handler
);

// WRONG - middleware in wrong order
app.delete('/api/users/:id', 
  roleMiddleware('admin'),  // This runs before auth!
  authMiddleware,
  handler
);
```

### Issue: Role not updating when promoted

**Cause:** Old token still cached on client

**Solution:**
1. Clear token on client after role change
2. Client must re-login to get new token with updated role
3. Or issue new token server-side and send to client

```typescript
// When admin changes user role
await db.users.update(userId, { role: 'moderator' });

// If same user is logged in, they should logout and login again
// OR server could send new token (advanced)
```

---

## Migration from Unroled System

If you have existing users without roles:

```typescript
// Set default role for existing users
UPDATE users SET role = 'user' WHERE role IS NULL;

// Create first admin user (manual or script)
UPDATE users SET role = 'admin' WHERE email = 'admin@your-app.com' LIMIT 1;

// Verify roles
SELECT COUNT(*), role FROM users GROUP BY role;
```

---

## Checklist

- [ ] Add role field to User model
- [ ] Create database migration
- [ ] Update User table with default role
- [ ] Modify generateAccessToken to include role
- [ ] Update authMiddleware to extract role
- [ ] Create BACKEND_RBAC_MIDDLEWARE.ts
- [ ] Apply roleMiddleware to admin routes
- [ ] Apply roleMiddleware to moderator routes
- [ ] Test authentication still works
- [ ] Test admin can access admin routes
- [ ] Test user gets 403 on admin routes
- [ ] Test role in JWT payload
- [ ] Set up audit logging
- [ ] Test audit log entries created
- [ ] Document role permissions
- [ ] Brief team on RBAC system

---

## Related Files

- [BACKEND_RBAC_MIDDLEWARE.ts](./BACKEND_RBAC_MIDDLEWARE.ts) - RBAC middleware functions
- [BACKEND_AUTH_MIDDLEWARE.ts](./BACKEND_AUTH_MIDDLEWARE.ts) - Auth middleware (update generateAccessToken)
- [JWT_SECURITY_GUIDE.md](./JWT_SECURITY_GUIDE.md) - JWT token details

