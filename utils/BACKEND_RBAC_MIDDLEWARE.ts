/**
 * Role-Based Access Control (RBAC) Implementation
 * 
 * Provides role-based authorization for protected endpoints
 * 
 * ⚠️ IMPORTANT: This is for BACKEND (Node.js) only
 * Do NOT import this in the client app
 * 
 * ROLES (in order of privilege):
 * - user (default) - Regular user account
 * - moderator - Can manage content, users, comments
 * - admin - Full system access
 * 
 * @usage
 * import { roleMiddleware, hasRole } from './rbac-middleware';
 * 
 * // Require specific role
 * app.delete('/api/users/:id', authMiddleware, roleMiddleware('admin'), deleteUserHandler);
 * 
 * // Require one of multiple roles
 * app.patch('/api/posts/:id', authMiddleware, roleMiddleware(['moderator', 'admin']), editPostHandler);
 * 
 * // Check role in handler
 * app.get('/api/admin/stats', authMiddleware, (req, res) => {
 *   if (!hasRole(req.user, 'admin')) {
 *     return res.status(403).json({ error: 'Forbidden' });
 *   }
 *   // Process admin request
 * });
 */

// @ts-ignore - Backend-only
import { Request, Response, NextFunction } from 'express';

/**
 * User role type definition
 */
export type UserRole = 'user' | 'moderator' | 'admin';

/**
 * Role hierarchy (for permission checking)
 * Higher index = higher privilege
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'user': 0,
  'moderator': 1,
  'admin': 2,
};

/**
 * JWT payload with role field
 */
export interface RoleAwarePayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

/**
 * Request object with authenticated user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Check if user has required role(s)
 * 
 * BACKEND ONLY
 * 
 * @param user - User object from request
 * @param requiredRole - Single role string or array of roles
 * @returns boolean - True if user has one of the required roles
 * 
 * @example
 * if (!hasRole(req.user, 'admin')) {
 *   return res.status(403).json({ error: 'Forbidden' });
 * }
 * 
 * if (!hasRole(req.user, ['moderator', 'admin'])) {
 *   return res.status(403).json({ error: 'Forbidden' });
 * }
 */
export function hasRole(
  user: any,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (!user || !user.role) {
    return false;
  }

  // Single role check
  if (typeof requiredRole === 'string') {
    return user.role === requiredRole;
  }

  // Multiple roles check (user must have one of them)
  return requiredRole.includes(user.role);
}

/**
 * Check if user has at least the required privilege level
 * 
 * BACKEND ONLY
 * 
 * Useful for hierarchical checks where moderator can also do user actions
 * 
 * @param user - User object from request
 * @param minimumRole - Minimum required role level
 * @returns boolean - True if user has at least the minimum role level
 * 
 * @example
 * // Moderators and admins can perform this action (not regular users)
 * if (!hasMinimumRole(req.user, 'moderator')) {
 *   return res.status(403).json({ error: 'Forbidden' });
 * }
 */
export function hasMinimumRole(user: any, minimumRole: UserRole): boolean {
  if (!user || !user.role || typeof user.role !== 'string') {
    return false;
  }

  const userLevel = ROLE_HIERARCHY[user.role as UserRole];
  const minimumLevel = ROLE_HIERARCHY[minimumRole];

  if (userLevel === undefined || minimumLevel === undefined) {
    return false;
  }

  return userLevel >= minimumLevel;
}

/**
 * Express middleware for role-based access control
 * 
 * BACKEND ONLY - Apply AFTER authMiddleware
 * 
 * @param requiredRoles - Single role or array of allowed roles
 * @returns Middleware function
 * 
 * @example
 * // Single role required
 * app.post('/api/admin/settings', authMiddleware, roleMiddleware('admin'), settingsHandler);
 * 
 * // Multiple roles allowed
 * app.patch('/api/posts/:id/moderate', authMiddleware, roleMiddleware(['moderator', 'admin']), moderatePostHandler);
 * 
 * // Using with hasMinimumRole (hierarchical)
 * app.get('/api/moderation/users', authMiddleware, roleMiddleware(['moderator', 'admin']), getModerationUsersHandler);
 */
export function roleMiddleware(requiredRoles: UserRole | UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      // User not authenticated (authMiddleware should have caught this)
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      // Check if user has required role
      if (!hasRole(user, requiredRoles)) {
        const roleList = Array.isArray(requiredRoles)
          ? requiredRoles.join(', ')
          : requiredRoles;

        console.warn(
          `Access denied: User ${user.userId} with role '${user.role}' tried to access resource requiring [${roleList}]`
        );

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for this action',
          },
        });
        return;
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ROLE_CHECK_ERROR',
          message: 'Error checking user permissions',
        },
      });
    }
  };
}

/**
 * Middleware for hierarchical role checking
 * 
 * BACKEND ONLY
 * 
 * Use when you want to allow a user with equal or HIGHER privilege
 * For example: admin can do everything moderator can do
 * 
 * @param minimumRole - Minimum required role level
 * @returns Middleware function
 * 
 * @example
 * // Only moderators and admins can access (not regular users)
 * app.get('/api/moderation/logs', authMiddleware, minimumRoleMiddleware('moderator'), getModerationLogsHandler);
 */
export function minimumRoleMiddleware(minimumRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      if (!hasMinimumRole(user, minimumRole)) {
        console.warn(
          `Access denied: User ${user.userId} with role '${user.role}' tried to access resource requiring minimum role '${minimumRole}'`
        );

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for this action',
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Minimum role middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ROLE_CHECK_ERROR',
          message: 'Error checking user permissions',
        },
      });
    }
  };
}

/**
 * Get role display name
 * 
 * @param role - User role
 * @returns Display name for the role
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    'user': 'User',
    'moderator': 'Moderator',
    'admin': 'Administrator',
  };
  return displayNames[role];
}

/**
 * Get role permissions
 * 
 * Useful for displaying what user can do
 * 
 * @param role - User role
 * @returns Array of permission strings
 */
export function getRolePermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    'user': [
      'view_profile',
      'edit_own_profile',
      'view_public_posts',
      'create_posts',
      'delete_own_posts',
      'like_posts',
      'comment_on_posts',
      'delete_own_comments',
      'view_messages',
      'send_messages',
    ],
    'moderator': [
      // Users permissions
      'view_profile',
      'edit_own_profile',
      'view_public_posts',
      'create_posts',
      'delete_own_posts',
      'like_posts',
      'comment_on_posts',
      'delete_own_comments',
      'view_messages',
      'send_messages',
      // Moderator permissions
      'moderate_posts',
      'delete_user_posts',
      'moderate_comments',
      'delete_user_comments',
      'moderate_users',
      'warn_users',
      'view_moderation_logs',
    ],
    'admin': [
      // All permissions
      'view_profile',
      'edit_own_profile',
      'view_public_posts',
      'create_posts',
      'delete_own_posts',
      'like_posts',
      'comment_on_posts',
      'delete_own_comments',
      'view_messages',
      'send_messages',
      'moderate_posts',
      'delete_user_posts',
      'moderate_comments',
      'delete_user_comments',
      'moderate_users',
      'warn_users',
      'view_moderation_logs',
      'manage_roles',
      'access_admin_panel',
      'view_analytics',
      'manage_system_settings',
      'manage_users',
      'view_all_logs',
    ],
  };

  return permissions[role];
}

/**
 * BACKEND SETUP FOR RBAC
 * 
 * ✓ User Model:
 *   interface User {
 *     id: string;
 *     email: string;
 *     role: 'user' | 'moderator' | 'admin'; // NEW FIELD
 *     ...other fields
 *   }
 * 
 * ✓ Database Migration:
 *   ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
 *   CREATE INDEX idx_users_role ON users(role);
 * 
 * ✓ JWT Payload:
 *   const accessToken = jwt.sign(
 *     {
 *       userId: user.id,
 *       email: user.email,
 *       role: user.role,  // ADD THIS
 *       type: 'access'
 *     },
 *     JWT_SECRET,
 *     { expiresIn: '15m' }
 *   );
 * 
 * ✓ Protected Routes:
 *   // Admin only
 *   app.delete('/api/users/:id', authMiddleware, roleMiddleware('admin'), deleteUserHandler);
 *   
 *   // Moderator or admin
 *   app.patch('/api/posts/:id/status', authMiddleware, roleMiddleware(['moderator', 'admin']), updatePostStatusHandler);
 *   
 *   // Using hasMinimumRole
 *   app.get('/api/moderation', authMiddleware, minimumRoleMiddleware('moderator'), getModerationHandler);
 * 
 * ✓ Audit Logging:
 *   await logAction({
 *     userId: req.user.userId,
 *     role: req.user.role,
 *     action: 'delete_user',
 *     targetId: req.params.id,
 *     timestamp: new Date(),
 *   });
 */

/**
 * EXAMPLE ROUTE IMPLEMENTATIONS
 * 
 * // Admin-only: Delete user
 * app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
 *   try {
 *     const targetUserId = req.params.id;
 *     
 *     // Log admin action
 *     await logAdminAction(req.user.userId, 'delete_user', targetUserId);
 *     
 *     // Delete user
 *     await db.users.delete(targetUserId);
 *     
 *     res.json({ success: true, message: 'User deleted' });
 *   } catch (error) {
 *     res.status(500).json({ success: false, error: 'Failed to delete user' });
 *   }
 * });
 * 
 * // Moderator or admin: Disable post
 * app.patch('/api/moderation/posts/:id/disable', 
 *   authMiddleware, 
 *   roleMiddleware(['moderator', 'admin']), 
 *   async (req, res) => {
 *     const postId = req.params.id;
 *     const reason = req.body.reason;
 *     
 *     await logModerationAction(req.user.userId, 'disable_post', postId, reason);
 *     await db.posts.update(postId, { disabled: true });
 *     
 *     res.json({ success: true });
 *   }
 * );
 * 
 * // Moderator+ : View moderation logs
 * app.get('/api/moderation/logs', 
 *   authMiddleware, 
 *   minimumRoleMiddleware('moderator'), 
 *   async (req, res) => {
 *     const logs = await db.auditLogs.getModerationLogs(req.query);
 *     res.json({ success: true, data: logs });
 *   }
 * );
 * 
 * // Regular user: View own profile (add role to check ownership too)
 * app.get('/api/users/:id', authMiddleware, async (req, res) => {
 *   const userId = req.params.id;
 *   
 *   // Check ownership or admin
 *   if (req.user.userId !== userId && !hasRole(req.user, 'admin')) {
 *     return res.status(403).json({ error: 'Cannot view other users profile' });
 *   }
 *   
 *   const user = await db.users.findById(userId);
 *   res.json({ success: true, data: user });
 * });
 */

/**
 * SECURITY NOTES
 * 
 * ✓ ALWAYS validate role on the backend (never trust client)
 * ✓ Include role in JWT token (signed by server)
 * ✓ Check role on EVERY protected endpoint
 * ✓ Log all privileged actions (audit trail)
 * ✓ Use 403 Forbidden for insufficient permissions
 * ✓ Use 401 Unauthorized for missing authentication
 * ✓ Never reveal what permissions are needed (security through obscurity)
 * ✓ Implement rate limiting on sensitive endpoints
 * ✓ Consider requiring re-authentication for sensitive admin actions
 * 
 * ✗ NEVER send role to client in response (only show what user can do)
 * ✗ NEVER change role on client request alone
 * ✗ NEVER trust client-provided role
 * ✗ NEVER skip role validation because "user is logged in"
 */
