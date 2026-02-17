/**
 * RBAC SYSTEM QUICK REFERENCE
 * 
 * One-page developer guide for the authentication and RBAC system
 */

// ============================================================
// FOLDER STRUCTURE
// ============================================================

/**
 * app/
 * ├── _layout.tsx ..................... Root layout with auth routing
 * ├── login.tsx ....................... Login screen
 * ├── admin/
 * │   ├── _layout.tsx ................. Admin section layout
 * │   ├── index.tsx ................... Admin dashboard
 * │   ├── users.tsx ................... User management
 * │   ├── roles.tsx ................... Role management
 * │   ├── settings.tsx ................ System settings
 * │   └── analytics.tsx ............... Analytics dashboard
 * ├── moderation/
 * │   ├── _layout.tsx ................. Moderation section layout
 * │   ├── index.tsx ................... Moderation dashboard
 * │   ├── logs.tsx .................... Action logs
 * │   ├── reports.tsx ................. Content reports
 * │   ├── queue.tsx ................... Review queue
 * │   └── warnings.tsx ................ User warnings
 * └── (existing routes) ............... Tabs, story, user, create-story
 * 
 * context/
 * └── AppContext.tsx .................. Auth state management
 * 
 * hooks/
 * ├── useAuth.ts ...................... Easy auth access
 * ├── useTokenRefresh.ts .............. Auto token refresh
 * └── useAuthMiddleware.ts ............ Route protection logic
 * 
 * components/
 * └── ProtectedRoute.tsx .............. Route guard components
 * 
 * utils/
 * ├── apiClient.ts .................... HTTP client (auto auth)
 * ├── authAPI.ts ...................... Auth endpoints
 * ├── User.ts ......................... Type definitions
 * └── feedAlgorithm.ts ................ (existing)
 */

// ============================================================
// QUICK START
// ============================================================

/**
 * BACKEND IMPLEMENTATION (2-3 hours):
 * 
 * 1. Database
 *    [ ] Run migration to add 'role' column to users table
 *    [ ] Update default role to 'user'
 * 
 * 2. Environment
 *    [ ] Set JWT_SECRET (32+ chars)
 *    [ ] Set JWT_REFRESH_SECRET (32+ chars)
 *    [ ] Set DATABASE_URL
 *    [ ] Set REDIS_URL (optional, for token blacklist)
 * 
 * 3. Endpoints
 *    [ ] POST /auth/login - validate credentials, return token + role
 *    [ ] POST /auth/refresh - return new access token
 *    [ ] POST /auth/logout - blacklist tokens
 *    [ ] GET /auth/verify - check token validity
 * 
 * 4. Middleware
 *    [ ] Apply authMiddleware to protected routes
 *    [ ] Apply roleMiddleware('admin') to admin routes
 *    [ ] Apply roleMiddleware('moderator', 'admin') to mod routes
 * 
 * 5. Test
 *    [ ] Login returns access + refresh token
 *    [ ] Token includes user role in payload
 *    [ ] Protected routes return 401 without token
 *    [ ] Admin routes return 403 for non-admin
 * 
 * Reference Files:
 * - BACKEND_AUTH_MIDDLEWARE.ts (620 lines)
 * - BACKEND_RBAC_MIDDLEWARE.ts (450 lines)
 * - BACKEND_ROUTES_WITH_RBAC.ts (route examples)
 */

/**
 * FRONTEND ALREADY COMPLETE ✅
 * 
 * What's ready:
 * [x] Login screen (app/login.tsx)
 * [x] Auth context (context/AppContext.tsx)
 * [x] useAuth hook (hooks/useAuth.ts)
 * [x] Protected routes (components/ProtectedRoute.tsx)
 * [x] Admin dashboard (app/admin/index.tsx)
 * [x] Moderation dashboard (app/moderation/index.tsx)
 * [x] API client (utils/apiClient.ts)
 * [x] Auth API (utils/authAPI.ts)
 * [x] Token refresh (hooks/useTokenRefresh.ts)
 * [x] TypeScript verified (0 errors)
 * 
 * What to do:
 * 1. Implement backend endpoints
 * 2. Connect frontend to backend
 * 3. Test login flow
 * 4. Implement admin/moderation screens
 */

// ============================================================
// AUTHENTICATION FLOW
// ============================================================

/**
 * LOGIN FLOW:
 * 
 * 1. User enters email/password
 * 2. Frontend calls: authAPI.login(email, password)
 * 3. apiClient sends: POST /api/auth/login
 * 4. Backend validates credentials (Argon2)
 * 5. Backend generates:
 *    - Access token (15 min expiration, includes role)
 *    - Refresh token (7 day, HTTP-only cookie)
 * 6. Frontend receives: { userId, email, role, accessToken, expiresIn }
 * 7. Frontend stores accessToken in AppContext
 * 8. Frontend stores token in localStorage (for page refresh)
 * 9. User redirected to home screen
 * 10. All API requests include: Authorization: Bearer <accessToken>
 */

/**
 * TOKEN REFRESH FLOW:
 * 
 * Background: useTokenRefresh hook runs every 30 seconds
 * 
 * 1. Token expiration checked
 * 2. If expires in < 60 seconds:
 * 3.   Call authAPI.refreshToken()
 * 4.   Backend validates refresh token (HTTP-only cookie)
 * 5.   Backend generates new access token
 * 6.   Frontend receives new token
 * 7.   Frontend updates AppContext
 * 8.   Frontend updates localStorage
 * 9. No user action required (seamless)
 * 
 * Also triggered on 401:
 * 1. API request returns 401 Unauthorized
 * 2. apiClient calls onUnauthorized handler
 * 3. Handler calls authAPI.refreshToken()
 * 4. Handler updates token in AppContext
 * 5. Original request is retried (automatic)
 */

/**
 * LOGOUT FLOW:
 * 
 * 1. User clicks logout button
 * 2. Frontend calls: auth.logout()
 * 3. Frontend calls: authAPI.logout()
 * 4. apiClient sends: POST /api/auth/logout
 * 5. Backend blacklists current refresh token
 * 6. Backend blacklists historical tokens (if needed)
 * 7. Frontend clears AppContext auth state
 * 8. Frontend clears localStorage
 * 9. Frontend redirects to login screen
 * 10. Old tokens no longer accepted
 */

// ============================================================
// USING AUTH IN COMPONENTS
// ============================================================

/**
 * CHECK IF USER IS LOGGED IN:
 * 
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function MyComponent() {
 *   const { isAuthenticated } = useAuth();
 *   
 *   return isAuthenticated ? (
 *     <Text>Welcome back!</Text>
 *   ) : (
 *     <Text>Please log in</Text>
 *   );
 * }
 */

/**
 * GET USER INFO:
 * 
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function ProfileScreen() {
 *   const { email, role, userId } = useAuth();
 *   
 *   return (
 *     <View>
 *       <Text>Email: {email}</Text>
 *       <Text>Role: {role}</Text>
 *       <Text>ID: {userId}</Text>
 *     </View>
 *   );
 * }
 */

/**
 * CHECK PERMISSIONS:
 * 
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function AdminButton() {
 *   const { isAdmin, isModerator } = useAuth();
 *   
 *   if (isAdmin) {
 *     return <Text>You are an admin</Text>;
 *   }
 *   
 *   if (isModerator) {
 *     return <Text>You are a moderator</Text>;
 *   }
 *   
 *   return <Text>No admin powers</Text>;
 * }
 */

/**
 * PROTECT A ROUTE:
 * 
 * import { AdminRoute } from '@/components/ProtectedRoute';
 * 
 * export default function AdminPage() {
 *   return (
 *     <AdminRoute>
 *       <View>
 *         <Text>Only admins see this</Text>
 *       </View>
 *     </AdminRoute>
 *   );
 * }
 */

/**
 * MAKE AUTHENTICATED API CALL:
 * 
 * import { apiClient } from '@/utils/apiClient';
 * 
 * async function loadUserData() {
 *   try {
 *     const data = await apiClient.get('/api/users/me');
 *     console.log(data);
 *     // Token automatically included as Authorization header
 *   } catch (error) {
 *     console.error('Failed to load user data', error);
 *   }
 * }
 */

/**
 * UPDATE USER ROLE (Admin only):
 * 
 * import { apiClient } from '@/utils/apiClient';
 * 
 * async function promoteUser(userId) {
 *   try {
 *     const result = await apiClient.patch(
 *       `/api/admin/users/${userId}`,
 *       { role: 'moderator' }
 *     );
 *     console.log('User promoted:', result);
 *   } catch (error) {
 *     if (error.status === 403) {
 *       console.error('You are not an admin');
 *     } else {
 *       console.error('Update failed:', error);
 *     }
 *   }
 * }
 */

// ============================================================
// BACKEND INTEGRATION
// ============================================================

/**
 * MINIMAL BACKEND SETUP:
 * 
 * 1. Create login endpoint:
 *    POST /api/auth/login
 *    Body: { email, password }
 *    Response: { userId, email, role, accessToken, expiresIn }
 * 
 * 2. Create refresh endpoint:
 *    POST /api/auth/refresh
 *    Cookies: refresh_token (HTTP-only)
 *    Response: { accessToken, expiresIn }
 * 
 * 3. Create logout endpoint:
 *    POST /api/auth/logout
 *    Headers: Authorization: Bearer <token>
 *    Response: { success: true }
 * 
 * 4. Create verify endpoint:
 *    GET /api/auth/verify
 *    Headers: Authorization: Bearer <token>
 *    Response: { userId, email, role }
 * 
 * 5. Protect routes:
 *    app.get('/api/posts', authMiddleware, handler)
 *    app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware, handler)
 */

/**
 * BACKEND ENDPOINTS NEEDED:
 * 
 * Authentication:
 * ├─ POST /api/auth/login ............. Login with email/password
 * ├─ POST /api/auth/refresh ........... Get new access token
 * ├─ POST /api/auth/logout ............ Invalidate tokens
 * ├─ GET /api/auth/verify ............ Check token validity
 * ├─ POST /api/auth/password-reset ... Request password reset
 * ├─ POST /api/auth/password-change .. Change password
 * └─ POST /api/auth/email-verify ..... Verify email token
 * 
 * User:
 * ├─ GET /api/users/me ............... Get current user
 * ├─ GET /api/users/:id .............. Get user by ID
 * ├─ PATCH /api/users/me ............. Update profile
 * └─ POST /api/users/profile-pic ..... Upload avatar
 * 
 * Admin:
 * ├─ GET /api/admin/users ............ List all users
 * ├─ PATCH /api/admin/users/:id ...... Update user role
 * ├─ DELETE /api/admin/users/:id ..... Delete user
 * ├─ GET /api/admin/analytics ........ System stats
 * └─ PATCH /api/admin/settings ....... Change settings
 * 
 * Moderator:
 * ├─ GET /api/moderation/logs ........ View action history
 * ├─ GET /api/moderation/reports ..... View reported content
 * ├─ DELETE /api/moderation/posts/:id  Remove post
 * ├─ PATCH /api/moderation/users/:id/warn Warn user
 * └─ GET /api/moderation/queue ....... Content review queue
 */

// ============================================================
// DEBUGGING
// ============================================================

/**
 * Check Current Auth State:
 * 
 * import { useApp } from '@/context/AppContext';
 * 
 * function DebugScreen() {
 *   const { auth } = useApp();
 *   console.log('Auth state:', {
 *     isAuthenticated: !!auth?.accessToken,
 *     token: auth?.accessToken?.substring(0, 20) + '...',
 *     role: auth?.user?.role,
 *     userId: auth?.user?.id,
 *     expiresAt: auth?.expiresAt
 *   });
 * }
 */

/**
 * Check Token in localStorage:
 * 
 * // In browser console or mobile debugging
 * localStorage.getItem('vairo_auth')
 * 
 * // Returns something like:
 * // {"userId":"123","email":"user@example.com","role":"admin","accessToken":"eyJ..."}
 */

/**
 * Monitor Network Requests:
 * 
 * // Check that requests include auth header
 * // Should see: Authorization: Bearer eyJ...
 * 
 * // Check response codes:
 * // 200 = Success
 * // 401 = Missing/invalid token (auto-refreshed)
 * // 403 = Wrong role/permissions
 * // 500 = Server error
 */

/**
 * Common Issues:
 * 
 * Problem: Getting 401 on protected routes
 * Solution 1: Check token is in localStorage
 * Solution 2: Check token hasn't expired
 * Solution 3: Verify backend JWT_SECRET matches frontend
 * 
 * Problem: Getting 403 Forbidden
 * Solution: Check user.role in database is correct
 * 
 * Problem: Login not working
 * Solution 1: Check EXPO_PUBLIC_API_URL is correct
 * Solution 2: Check backend /api/auth/login endpoint exists
 * Solution 3: Check credentials are valid
 * 
 * Problem: Token not refreshing
 * Solution 1: Check REDIS_URL is set (if using blacklist)
 * Solution 2: Check refresh token is in cookies
 * Solution 3: Check useTokenRefresh hook is running
 */

// ============================================================
// SECURITY REMINDERS
// ============================================================

/**
 * ✅ DO:
 * - Always use HTTPS in production
 * - Use strong JWT secrets (32+ chars)
 * - Keep access tokens short-lived (15 min)
 * - Keep refresh tokens in HTTP-only cookies
 * - Verify role on backend (frontend check is UX only)
 * - Log failed login attempts
 * - Implement rate limiting
 * - Use parameterized queries (prevent SQL injection)
 * 
 * ❌ DON'T:
 * - Store passwords in plain text
 * - Commit .env to git
 * - Use same secret for all environments
 * - Allow user to change own role on frontend
 * - Trust frontend permission checks alone
 * - Log sensitive data (passwords, tokens)
 * - Share secrets in chat/email
 * - Use expired dependencies (npm audit)
 */

/**
 * BEFORE PRODUCTION:
 * 
 * [ ] Run: npm audit (zero high/critical)
 * [ ] Run: npm run typecheck (0 errors)
 * [ ] Test: Complete login flow
 * [ ] Test: Admin routes return 403 for non-admin
 * [ ] Test: Token refresh works
 * [ ] Set: NODE_ENV=production
 * [ ] Enable: HTTPS
 * [ ] Configure: Proper JWT secrets
 * [ ] Configure: Database backups
 * [ ] Test: Logout properly blacklists tokens
 * [ ] Check: Rate limiting configured
 * [ ] Check: CORS origins set correctly
 */

export {};
