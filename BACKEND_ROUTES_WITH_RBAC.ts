/**
 * Backend Routes with RBAC - Express.js Examples
 * 
 * ⚠️ IMPORTANT: This file is for BACKEND (Node.js) only
 * Shows how to protect routes with role-based access control
 * 
 * Setup:
 * 1. Import middleware from utils
 * 2. Apply authMiddleware to check authentication
 * 3. Apply roleMiddleware to check authorization
 * 4. Handler processes request only if both checks pass
 * 
 * @usage
 * import express from 'express';
 * import { authMiddleware } from './utils/auth-middleware';
 * import { roleMiddleware, minimumRoleMiddleware } from './utils/rbac-middleware';
 * 
 * const app = express();
 * 
 * // Admin-only route
 * app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), deleteUserHandler);
 * 
 * // Moderator+ route (admin or moderator)
 * app.patch('/api/moderation/posts/:id', authMiddleware, roleMiddleware(['moderator', 'admin']), handleModerationHandler);
 */

// ============================================================
// ADMIN-ONLY ROUTES
// ============================================================

/**
 * GET /api/admin/users
 * List all users (admin only)
 * 
 * Response 200:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "user_123",
 *       "email": "user@example.com",
 *       "role": "user",
 *       "createdAt": "2026-02-17T..."
 *     }
 *   ]
 * }
 * 
 * Response 403:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "FORBIDDEN",
 *     "message": "Insufficient permissions for this action"
 *   }
 * }
 */
// app.get('/api/admin/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   try {
//     const users = await db.users.find();
//     
//     res.status(200).json({
//       success: true,
//       data: users.map(user => ({
//         id: user.id,
//         email: user.email,
//         name: user.displayName,
//         role: user.role,
//         createdAt: user.createdAt,
//       })),
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
//   }
// });

/**
 * GET /api/admin/users/:id
 * Get user details (admin only)
 */
// app.get('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   const user = await db.users.findById(req.params.id);
//   if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   res.status(200).json({ success: true, data: user });
// });

/**
 * PATCH /api/admin/users/:id
 * Update user (admin only)
 * 
 * Request body:
 * {
 *   "role": "moderator" | "admin" | "user",
 *   "isSuspended": boolean,
 *   "suspensionReason": string
 * }
 * 
 * Response 200: Updated user
 * Response 403: Forbidden
 * Response 404: User not found
 */
// app.patch('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   const { role, isSuspended, suspensionReason } = req.body;
//   
//   // Validate role if provided
//   if (role && !['user', 'moderator', 'admin'].includes(role)) {
//     return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE' } });
//   }
//   
//   const user = await db.users.findByIdAndUpdate(req.params.id, {
//     role,
//     isSuspended,
//     suspensionReason,
//   });
//   
//   if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   // Log admin action
//   await db.auditLogs.create({
//     adminId: req.user.userId,
//     action: 'update_user',
//     targetId: req.params.id,
//     changes: { role, isSuspended, suspensionReason },
//     timestamp: new Date(),
//   });
//   
//   res.status(200).json({ success: true, data: user });
// });

/**
 * DELETE /api/admin/users/:id
 * Delete user (admin only)
 * 
 * Response 200: { success: true }
 * Response 403: Forbidden
 * Response 404: User not found
 */
// app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   const user = await db.users.findById(req.params.id);
//   if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   await db.users.deleteById(req.params.id);
//   
//   // Log admin action
//   await db.auditLogs.create({
//     adminId: req.user.userId,
//     action: 'delete_user',
//     targetId: req.params.id,
//     reason: req.body.reason,
//     timestamp: new Date(),
//   });
//   
//   res.status(200).json({ success: true });
// });

/**
 * GET /api/admin/settings
 * Get system settings (admin only)
 */
// app.get('/api/admin/settings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   const settings = await db.settings.get();
//   res.status(200).json({ success: true, data: settings });
// });

/**
 * PATCH /api/admin/settings
 * Update system settings (admin only)
 */
// app.patch('/api/admin/settings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   const settings = await db.settings.update(req.body);
//   
//   // Log admin action
//   await db.auditLogs.create({
//     adminId: req.user.userId,
//     action: 'update_settings',
//     changes: req.body,
//     timestamp: new Date(),
//   });
//   
//   res.status(200).json({ success: true, data: settings });
// });

/**
 * GET /api/admin/analytics
 * Get system analytics (admin only)
 */
// app.get('/api/admin/analytics', authMiddleware, roleMiddleware('admin'), async (req, res) => {
//   const analytics = await db.analytics.get();
//   res.status(200).json({ success: true, data: analytics });
// });


// ============================================================
// MODERATOR+ ROUTES (moderator or admin)
// ============================================================

/**
 * GET /api/moderation/logs
 * Get moderation action logs (moderator+)
 * Uses minimumRoleMiddleware for hierarchical checking
 */
// app.get('/api/moderation/logs', authMiddleware, minimumRoleMiddleware('moderator'), async (req, res) => {
//   const logs = await db.moderationLogs.find({ limit: 100 });
//   res.status(200).json({ success: true, data: logs });
// });

/**
 * DELETE /api/moderation/posts/:id
 * Delete post (moderator+)
 * Exact role check: moderator or admin only
 * 
 * Response 200: { success: true }
 * Response 403: Forbidden (regular users get this)
 * Response 404: Post not found
 */
// app.delete('/api/moderation/posts/:id', authMiddleware, roleMiddleware(['moderator', 'admin']), async (req, res) => {
//   const post = await db.posts.findById(req.params.id);
//   if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   const reason = req.body.reason || 'No reason provided';
//   await db.posts.deleteById(req.params.id);
//   
//   // Log moderation action
//   await db.moderationLogs.create({
//     moderatorId: req.user.userId,
//     action: 'delete_post',
//     targetId: req.params.id,
//     targetUserId: post.userId,
//     reason,
//     timestamp: new Date(),
//   });
//   
//   res.status(200).json({ success: true });
// });

/**
 * PATCH /api/moderation/posts/:id/status
 * Change post visibility status (moderator+)
 * 
 * Request body:
 * {
 *   "status": "visible" | "hidden" | "removed",
 *   "reason": "Violates community guidelines"
 * }
 */
// app.patch('/api/moderation/posts/:id/status', authMiddleware, roleMiddleware(['moderator', 'admin']), async (req, res) => {
//   const { status, reason } = req.body;
//   
//   if (!['visible', 'hidden', 'removed'].includes(status)) {
//     return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS' } });
//   }
//   
//   const post = await db.posts.findByIdAndUpdate(req.params.id, { status });
//   if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   // Log moderation action
//   await db.moderationLogs.create({
//     moderatorId: req.user.userId,
//     action: 'change_post_status',
//     targetId: req.params.id,
//     targetUserId: post.userId,
//     changes: { status },
//     reason,
//     timestamp: new Date(),
//   });
//   
//   res.status(200).json({ success: true, data: post });
// });

/**
 * PATCH /api/moderation/users/:id/warn
 * Warn a user (moderator+)
 * 
 * Request body:
 * {
 *   "reason": "Spam content",
 *   "severity": "low" | "medium" | "high"
 * }
 */
// app.patch('/api/moderation/users/:id/warn', authMiddleware, roleMiddleware(['moderator', 'admin']), async (req, res) => {
//   const user = await db.users.findById(req.params.id);
//   if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   const { reason, severity } = req.body;
//   
//   // Log warning
//   await db.userWarnings.create({
//     userId: req.params.id,
//     reason,
//     severity,
//     issuedBy: req.user.userId,
//     timestamp: new Date(),
//   });
//   
//   res.status(200).json({ success: true, message: 'User warned' });
// });


// ============================================================
// OWNER OR ADMIN ROUTES
// ============================================================

/**
 * PATCH /api/posts/:id
 * Update post (owner or admin)
 * 
 * Can be modified by:
 * - Post owner (any role)
 * - Admin (regardless of ownership)
 * 
 * Request body:
 * {
 *   "caption": "New caption",
 *   "media_url": "https://..."
 * }
 * 
 * Response 200: Updated post
 * Response 403: Not owner and not admin
 * Response 404: Post not found
 */
// app.patch('/api/posts/:id', authMiddleware, async (req, res) => {
//   const post = await db.posts.findById(req.params.id);
//   if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   // Check: Is user the owner OR an admin?
//   const isOwner = post.userId === req.user.userId;
//   const isAdmin = req.user.role === 'admin';
//   
//   if (!isOwner && !isAdmin) {
//     return res.status(403).json({
//       success: false,
//       error: { code: 'FORBIDDEN', message: 'Cannot modify another user\'s post' },
//     });
//   }
//   
//   const updated = await db.posts.findByIdAndUpdate(req.params.id, req.body);
//   res.status(200).json({ success: true, data: updated });
// });

/**
 * DELETE /api/posts/:id
 * Delete post (owner or admin)
 */
// app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
//   const post = await db.posts.findById(req.params.id);
//   if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   const isOwner = post.userId === req.user.userId;
//   const isAdmin = req.user.role === 'admin';
//   
//   if (!isOwner && !isAdmin) {
//     return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
//   }
//   
//   await db.posts.deleteById(req.params.id);
//   res.status(200).json({ success: true });
// });


// ============================================================
// PUBLIC ROUTES (no role check needed)
// ============================================================

/**
 * GET /api/posts
 * Get posts feed (public, no auth required)
 */
// app.get('/api/posts', async (req, res) => {
//   const posts = await db.posts.find({ status: 'visible', limit: 20 });
//   res.status(200).json({ success: true, data: posts });
// });

/**
 * POST /api/posts
 * Create post (authenticated users, any role)
 * 
 * Note: Use authMiddleware but NOT roleMiddleware
 * This allows any authenticated user to create posts
 */
// app.post('/api/posts', authMiddleware, async (req, res) => {
//   const { caption, type, mediaUrl } = req.body;
//   
//   const post = await db.posts.create({
//     userId: req.user.userId,
//     caption,
//     type,
//     mediaUrl,
//   });
//   
//   res.status(201).json({ success: true, data: post });
// });

/**
 * GET /api/posts/:id
 * Get post details (public, no auth required)
 */
// app.get('/api/posts/:id', async (req, res) => {
//   const post = await db.posts.findById(req.params.id);
//   if (!post || post.status !== 'visible') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
//   
//   res.status(200).json({ success: true, data: post });
// });


// ============================================================
// PROTECTED ROUTE PATTERNS
// ============================================================

/**
 * Pattern 1: Admin only
 * app.METHOD('/path', authMiddleware, roleMiddleware('admin'), handler);
 * 
 * Pattern 2: Moderator or admin
 * app.METHOD('/path', authMiddleware, roleMiddleware(['moderator', 'admin']), handler);
 * 
 * Pattern 3: Moderator+ (hierarchical)
 * app.METHOD('/path', authMiddleware, minimumRoleMiddleware('moderator'), handler);
 * 
 * Pattern 4: Owner or admin
 * app.METHOD('/path', authMiddleware, async (req, res, next) => {
 *   if (resource.ownerId !== req.user.userId && req.user.role !== 'admin') {
 *     return res.status(403).json({ success: false, error: {...} });
 *   }
 *   next();
 * }, handler);
 * 
 * Pattern 5: Public (no auth required)
 * app.METHOD('/path', handler);
 * 
 * Pattern 6: Authenticated only (any role)
 * app.METHOD('/path', authMiddleware, handler);
 */

