/**
 * RBAC Implementation Guide - Frontend
 * 
 * Complete guide to implementing role-based access control on the React Native frontend
 * 
 * Features:
 * - useAuth hook for easy auth state access
 * - Protected route components
 * - Login screen
 * - Admin and Moderator dashboards
 * - Role-based conditional rendering
 */

// ============================================================
// 1. AUTHENTICATION WITH useAuth HOOK
// ============================================================

/**
 * The useAuth hook provides easy access to:
 * - isAuthenticated: boolean
 * - auth: { userId, email, role, accessToken, expiresIn }
 * - login(email, password): Promise<void>
 * - logout(): Promise<void>
 * - isAdmin(), isModerator(): boolean
 * - canModerate(), canAdminister(): boolean
 * 
 * @example
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function MyComponent() {
 *   const { isAuthenticated, auth, login, logout } = useAuth();
 *   
 *   return (
 *     <>
 *       {isAuthenticated ? (
 *         <>
 *           <Text>Welcome, {auth?.email}</Text>
 *           <Button onPress={logout} title="Logout" />
 *         </>
 *       ) : (
 *         <Button onPress={() => login('user@example.com', 'password')} title="Login" />
 *       )}
 *     </>
 *   );
 * }
 */

// ============================================================
// 2. PROTECTED ROUTES
// ============================================================

/**
 * Use protected route components to wrap screens that require authentication
 * 
 * ProtectedRoute: Requires authentication
 * AdminRoute: Requires admin role
 * ModeratorRoute: Requires moderator or admin
 * RoleBasedRoute: Requires specific roles
 * 
 * @example
 * import { AdminRoute } from '@/components/ProtectedRoute';
 * 
 * function AdminContent() {
 *   return <Text>Admin-only content</Text>;
 * }
 * 
 * export default function AdminScreen() {
 *   return (
 *     <AdminRoute>
 *       <AdminContent />
 *     </AdminRoute>
 *   );
 * }
 */

// ============================================================
// 3. ROLE-BASED CONDITIONAL RENDERING
// ============================================================

/**
 * Show/hide UI elements based on user role
 * 
 * @example
 * function UserProfile() {
 *   const { isAdmin, isModerator, canModerate } = useAuth();
 *   
 *   return (
 *     <View>
 *       <Text>User Name</Text>
 *       
 *       {canModerate() && (
 *         <TouchableOpacity>
 *           <Text>Moderate this user</Text>
 *         </TouchableOpacity>
 *       )}
 *       
 *       {isAdmin() && (
 *         <TouchableOpacity>
 *           <Text>Delete this user (admin only)</Text>
 *         </TouchableOpacity>
 *       )}
 *     </View>
 *   );
 * }
 */

// ============================================================
// 4. API REQUESTS WITH AUTHENTICATION
// ============================================================

/**
 * Include access token in API requests
 * 
 * @example
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function useAPI() {
 *   const { accessToken } = useAuth();
 *   
 *   async function deleteUser(userId: string) {
 *     const response = await fetch(`/api/admin/users/${userId}`, {
 *       method: 'DELETE',
 *       headers: {
 *         'Authorization': `Bearer ${accessToken}`,
 *         'Content-Type': 'application/json',
 *       },
 *     });
 *     
 *     return response.json();
 *   }
 *   
 *   return { deleteUser };
 * }
 */

// ============================================================
// 5. LOGIN FLOW
// ============================================================

/**
 * Complete login flow:
 * 
 * 1. User enters email and password
 * 2. Frontend calls login(email, password)
 * 3. Backend validates credentials and returns:
 *    {
 *      "success": true,
 *      "data": {
 *        "userId": "user_123",
 *        "email": "user@example.com",
 *        "role": "moderator",
 *        "accessToken": "eyJhbGc...",
 *        "expiresIn": 900
 *      }
 *    }
 * 4. Frontend stores in auth state and localStorage
 * 5. User is redirected to main app
 * 
 * @example
 * // In login.tsx
 * const handleLogin = async () => {
 *   try {
 *     await login(email, password);
 *     router.push('/(tabs)');
 *   } catch (error) {
 *     setError('Login failed: ' + error.message);
 *   }
 * };
 */

// ============================================================
// 6. LOGOUT FLOW
// ============================================================

/**
 * Complete logout flow:
 * 
 * 1. User taps logout button
 * 2. Frontend calls logout()
 * 3. Frontend calls backend /auth/logout endpoint (optional)
 * 4. Backend blacklists tokens
 * 5. Frontend clears auth state
 * 6. Frontend clears localStorage
 * 7. User is redirected to login
 * 
 * @example
 * const handleLogout = async () => {
 *   try {
 *     await logout();
 *     router.push('/login');
 *   } catch (error) {
 *     console.error('Logout failed:', error);
 *   }
 * };
 */

// ============================================================
// 7. ADMIN DASHBOARD
// ============================================================

/**
 * Admin dashboard is at /admin
 * Available to admin users only
 * 
 * Routes:
 * - /admin - Dashboard
 * - /admin/users - User management
 * - /admin/roles - Role management
 * - /admin/settings - System settings
 * - /admin/analytics - Analytics
 * 
 * Add new admin screens in app/admin/ directory
 * Wrap with <AdminRoute> to require admin role
 */

// ============================================================
// 8. MODERATION DASHBOARD
// ============================================================

/**
 * Moderation dashboard is at /moderation
 * Available to moderator and admin users
 * 
 * Routes:
 * - /moderation - Dashboard
 * - /moderation/logs - Moderation logs
 * - /moderation/reports - Reported content
 * - /moderation/queue - Review queue
 * - /moderation/warnings - User warnings
 * 
 * Add new moderation screens in app/moderation/ directory
 * Wrap with <ModeratorRoute> to require moderator+ role
 */

// ============================================================
// 9. COMMON PATTERNS
// ============================================================

/**
 * Pattern: Show admin button in profile
 * 
 * function UserProfile() {
 *   const { isAdmin } = useAuth();
 *   const isCurrentUserAdmin = isAdmin();
 *   
 *   return (
 *     <View>
 *       {isCurrentUserAdmin && (
 *         <Button title="Admin Controls" onPress={() => router.push('/admin')} />
 *       )}
 *     </View>
 *   );
 * }
 */

/**
 * Pattern: Disable moderation for non-moderators
 * 
 * function ContentItem() {
 *   const { canModerate } = useAuth();
 *   
 *   return (
 *     <View>
 *       {canModerate() && (
 *         <TouchableOpacity onPress={flagContent}>
 *           <Text>🚩 Report</Text>
 *         </TouchableOpacity>
 *       )}
 *     </View>
 *   );
 * }
 */

/**
 * Pattern: Require admin for sensitive operations
 * 
 * const deletePost = async (postId: string) => {
 *   const { isAdmin } = useAuth();
 *   
 *   if (!isAdmin()) {
 *     alert('Only admins can delete posts');
 *     return;
 *   }
 *   
 *   // Delete logic...
 * };
 */

// ============================================================
// 10. SECURITY CONSIDERATIONS
// ============================================================

/**
 * ✅ DO:
 * - Keep access token in memory (useAuth state)
 * - Check role on backend for every protected operation
 * - Redirect to login on 401 response
 * - Clear only access token on logout, not stored role
 * - Validate role on backend even if trusted from frontend
 * - Log admin actions
 * 
 * ❌ DON'T:
 * - Trust client-side role checks for security
 * - Keep access token in AsyncStorage (use RAM)
 * - Allow users to change their own role
 * - Show password in logs
 * - Use role for sensitive operations without server validation
 * - Keep old access tokens after logout
 */

// ============================================================
// 11. ERROR HANDLING
// ============================================================

/**
 * Handle auth errors:
 * 
 * - 401 Unauthorized: Token missing or invalid
 *   → Clear auth and redirect to login
 * 
 * - 403 Forbidden: User lacks permissions
 *   → Show "Access Denied" message
 * 
 * - Network error: Can't reach backend
 *   → Show "Network error" and retry button
 * 
 * @example
 * async function apiCall(endpoint: string) {
 *   const { accessToken } = useAuth();
 *   
 *   try {
 *     const response = await fetch(endpoint, {
 *       headers: { 'Authorization': `Bearer ${accessToken}` },
 *     });
 *     
 *     if (response.status === 401) {
 *       // Clear auth and redirect
 *       logout();
 *       router.push('/login');
 *       return;
 *     }
 *     
 *     if (response.status === 403) {
 *       alert('You don\'t have permission to do this');
 *       return;
 *     }
 *     
 *     return await response.json();
 *   } catch (error) {
 *     alert('Network error: ' + error.message);
 *   }
 * }
 */

// ============================================================
// 12. TESTING
// ============================================================

/**
 * Test role-based features:
 * 
 * 1. Login with regular user account
 *    - Should NOT see admin menu
 *    - Should NOT access /admin
 *    - Should see access denied if trying
 * 
 * 2. Login with admin account
 *    - Should see admin menu
 *    - Should access /admin
 *    - Should be able to manage users
 * 
 * 3. Login with moderator account
 *    - Should see moderation menu
 *    - Should NOT access /admin
 *    - Should be able to moderate content
 * 
 * 4. Logout
 *    - Auth state should clear
 *    - Access token should be removed
 *    - Should redirect to login
 *    - Should NOT be able to access protected routes
 */

// ============================================================
// 13. DIRECTORY STRUCTURE
// ============================================================

/**
 * RBAC-related files:
 * 
 * hooks/
 *   useAuth.ts                 - Auth state hook
 *   useAuthMiddleware.ts       - Auth routing middleware
 * 
 * components/
 *   ProtectedRoute.tsx         - Route guard components
 * 
 * context/
 *   AppContext.tsx             - Auth state management
 * 
 * utils/
 *   User.ts                    - User type definitions
 *   BACKEND_AUTH_MIDDLEWARE.ts - Backend auth middleware
 *   BACKEND_RBAC_MIDDLEWARE.ts - Backend RBAC middleware
 * 
 * app/
 *   _layout.tsx                - Root layout with auth routing
 *   login.tsx                  - Login screen
 *   admin/
 *     index.tsx                - Admin dashboard
 *     users.tsx                - User management
 *     roles.tsx                - Role management
 *     settings.tsx             - System settings
 *     analytics.tsx            - Analytics
 *   moderation/
 *     index.tsx                - Moderation dashboard
 *     logs.tsx                 - Moderation logs
 *     reports.tsx              - Reported content
 *     queue.tsx                - Review queue
 *     warnings.tsx             - User warnings
 */

export {};
