/**
 * RATE LIMITING IMPLEMENTATION EXAMPLES
 * 
 * Shows how to apply rate limiters to Express routes
 * Copy patterns to your actual route handlers
 */

// ============================================================
// IMPORT RATE LIMITERS
// ============================================================

/**
 * In your main Express app:
 * 
 * import { rateLimiters } from '@/middleware/rateLimiters';
 * import express from 'express';
 * 
 * const app = express();
 * 
 * // Apply rate limiters to routes
 */

// ============================================================
// AUTHENTICATION ENDPOINTS
// ============================================================

/**
 * 1. LOGIN ENDPOINT
 * 
 * POST /api/auth/login
 * Request: { email, password }
 * Response: { userId, email, role, accessToken, expiresIn }
 * 
 * Rate Limit: 5 attempts per minute per IP
 * Error: 429 Too Many Requests after 5 failed attempts
 * 
 * Implementation:
 */

/**
 * app.post('/api/auth/login',
 *   rateLimiters.login,  // ← Apply login limiter
 *   validateLoginInput,  // Validate email/password
 *   loginHandler         // Process login
 * );
 * 
 * async function loginHandler(req, res) {
 *   try {
 *     const { email, password } = req.body;
 *     
 *     // Validate credentials
 *     const user = await User.findOne({ email });
 *     if (!user) {
 *       // Don't reveal user doesn't exist (security)
 *       return res.status(401).json({ message: 'Invalid credentials' });
 *     }
 *     
 *     // Verify password
 *     const validPassword = await argon2.verify(user.passwordHash, password);
 *     if (!validPassword) {
 *       return res.status(401).json({ message: 'Invalid credentials' });
 *     }
 *     
 *     // Generate tokens
 *     const accessToken = generateAccessToken(user.id, user.role);
 *     const refreshToken = generateRefreshToken(user.id);
 *     
 *     // Set refresh token in HTTP-only cookie
 *     res.cookie('refresh_token', refreshToken, {
 *       httpOnly: true,
 *       secure: process.env.HTTPS === 'true',
 *       sameSite: 'strict',
 *       maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
 *     });
 *     
 *     return res.json({
 *       userId: user.id,
 *       email: user.email,
 *       role: user.role,
 *       accessToken,
 *       expiresIn: 15 * 60 // 15 minutes
 *     });
 *   } catch (error) {
 *     console.error('Login error:', error);
 *     return res.status(500).json({ message: 'Login failed' });
 *   }
 * }
 */

/**
 * 2. REGISTER ENDPOINT
 * 
 * POST /api/auth/register
 * Request: { email, password }
 * Response: { userId, email, accessToken, expiresIn }
 * 
 * Rate Limit: 3 accounts per hour per IP
 * Error: 429 Too Many Requests after 3 registrations
 * 
 * Implementation:
 */

/**
 * app.post('/api/auth/register',
 *   rateLimiters.register,  // ← Apply register limiter
 *   validateRegisterInput,
 *   registerHandler
 * );
 * 
 * async function registerHandler(req, res) {
 *   try {
 *     const { email, password } = req.body;
 *     
 *     // Check if email already exists
 *     const existing = await User.findOne({ email });
 *     if (existing) {
 *       return res.status(409).json({ message: 'Email already in use' });
 *     }
 *     
 *     // Hash password
 *     const passwordHash = await argon2.hash(password);
 *     
 *     // Create user
 *     const user = await User.create({
 *       email,
 *       passwordHash,
 *       role: 'user' // Default role
 *     });
 *     
 *     // Generate tokens
 *     const accessToken = generateAccessToken(user.id, user.role);
 *     const refreshToken = generateRefreshToken(user.id);
 *     
 *     res.cookie('refresh_token', refreshToken, {
 *       httpOnly: true,
 *       secure: process.env.HTTPS === 'true',
 *       sameSite: 'strict',
 *       maxAge: 7 * 24 * 60 * 60 * 1000
 *     });
 *     
 *     return res.status(201).json({
 *       userId: user.id,
 *       email: user.email,
 *       accessToken,
 *       expiresIn: 15 * 60
 *     });
 *   } catch (error) {
 *     console.error('Registration error:', error);
 *     return res.status(500).json({ message: 'Registration failed' });
 *   }
 * }
 */

/**
 * 3. PASSWORD RESET ENDPOINT
 * 
 * POST /api/auth/password-reset
 * Request: { email }
 * Response: { message: "Check your email for reset link" }
 * 
 * Rate Limit: 5 requests per hour per email
 * Error: 429 Too Many Requests after 5 attempts
 * 
 * Implementation:
 */

/**
 * app.post('/api/auth/password-reset',
 *   rateLimiters.passwordReset,  // ← Apply reset limiter
 *   validateEmailInput,
 *   passwordResetHandler
 * );
 * 
 * async function passwordResetHandler(req, res) {
 *   try {
 *     const { email } = req.body;
 *     
 *     // Check if user exists (don't reveal)
 *     const user = await User.findOne({ email });
 *     if (!user) {
 *       // Return success even if not found (security: email enumeration)
 *       return res.json({ message: 'Check your email for reset link' });
 *     }
 *     
 *     // Generate reset token (expires in 1 hour)
 *     const resetToken = generatePasswordResetToken(user.id);
 *     
 *     // Store token hash in database
 *     await user.updateOne({
 *       resetTokenHash: hashToken(resetToken),
 *       resetTokenExpires: Date.now() + 60 * 60 * 1000 // 1 hour
 *     });
 *     
 *     // Send email with reset link
 *     await sendPasswordResetEmail(email, resetToken);
 *     
 *     return res.json({ message: 'Check your email for reset link' });
 *   } catch (error) {
 *     console.error('Password reset error:', error);
 *     return res.status(500).json({ message: 'Reset failed' });
 *   }
 * }
 */

// ============================================================
// CONTENT CREATION ENDPOINTS (Require Authentication)
// ============================================================

/**
 * 4. CREATE POST ENDPOINT
 * 
 * POST /api/posts
 * Request: { content, mediaUrls? }
 * Response: { postId, content, createdAt, userId }
 * 
 * Rate Limit: 20 posts per minute per user
 * Error: 429 Too Many Requests after 20 posts in 60 seconds
 * 
 * Implementation:
 */

/**
 * app.post('/api/posts',
 *   authMiddleware,          // ← Require authentication
 *   rateLimiters.createPost, // ← Apply post limiter
 *   validatePostInput,
 *   createPostHandler
 * );
 * 
 * async function createPostHandler(req, res) {
 *   try {
 *     const { content, mediaUrls } = req.body;
 *     const userId = req.user.id; // From authMiddleware
 *     
 *     // Validate content
 *     if (!content || content.trim().length === 0) {
 *       return res.status(400).json({ message: 'Content is required' });
 *     }
 *     
 *     if (content.length > 10000) {
 *       return res.status(400).json({ message: 'Content too long' });
 *     }
 *     
 *     // Create post
 *     const post = await Post.create({
 *       userId,
 *       content,
 *       mediaUrls,
 *       createdAt: new Date(),
 *       likes: [],
 *       comments: []
 *     });
 *     
 *     return res.status(201).json({
 *       postId: post.id,
 *       content: post.content,
 *       createdAt: post.createdAt,
 *       userId: post.userId
 *     });
 *   } catch (error) {
 *     console.error('Post creation error:', error);
 *     return res.status(500).json({ message: 'Failed to create post' });
 *   }
 * }
 */

/**
 * 5. CREATE COMMENT ENDPOINT
 * 
 * POST /api/posts/:postId/comments
 * Request: { content }
 * Response: { commentId, content, createdAt, userId }
 * 
 * Rate Limit: 50 comments per minute per user
 * Error: 429 Too Many Requests after 50 comments in 60 seconds
 * 
 * Implementation:
 */

/**
 * app.post('/api/posts/:postId/comments',
 *   authMiddleware,
 *   rateLimiters.createComment, // ← Apply comment limiter
 *   validateCommentInput,
 *   createCommentHandler
 * );
 * 
 * async function createCommentHandler(req, res) {
 *   try {
 *     const { postId } = req.params;
 *     const { content } = req.body;
 *     const userId = req.user.id;
 *     
 *     // Validate post exists
 *     const post = await Post.findById(postId);
 *     if (!post) {
 *       return res.status(404).json({ message: 'Post not found' });
 *     }
 *     
 *     // Validate comment
 *     if (!content || content.trim().length === 0) {
 *       return res.status(400).json({ message: 'Comment is required' });
 *     }
 *     
 *     // Create comment
 *     const comment = await Comment.create({
 *       postId,
 *       userId,
 *       content,
 *       createdAt: new Date()
 *     });
 *     
 *     return res.status(201).json({
 *       commentId: comment.id,
 *       content: comment.content,
 *       createdAt: comment.createdAt,
 *       userId: comment.userId
 *     });
 *   } catch (error) {
 *     console.error('Comment creation error:', error);
 *     return res.status(500).json({ message: 'Failed to create comment' });
 *   }
 * }
 */

/**
 * 6. LIKE/UNLIKE ENDPOINT
 * 
 * POST /api/posts/:postId/like
 * Request: (no body)
 * Response: { liked: true/false, likeCount }
 * 
 * Rate Limit: 100 likes per minute per user
 * Error: 429 Too Many Requests after 100 likes in 60 seconds
 * 
 * Implementation:
 */

/**
 * app.post('/api/posts/:postId/like',
 *   authMiddleware,
 *   rateLimiters.like, // ← Apply like limiter
 *   toggleLikeHandler
 * );
 * 
 * async function toggleLikeHandler(req, res) {
 *   try {
 *     const { postId } = req.params;
 *     const userId = req.user.id;
 *     
 *     // Find post
 *     const post = await Post.findById(postId);
 *     if (!post) {
 *       return res.status(404).json({ message: 'Post not found' });
 *     }
 *     
 *     // Check if already liked
 *     const alreadyLiked = post.likes.includes(userId);
 *     
 *     if (alreadyLiked) {
 *       // Unlike
 *       post.likes = post.likes.filter(id => id !== userId);
 *     } else {
 *       // Like
 *       post.likes.push(userId);
 *     }
 *     
 *     await post.save();
 *     
 *     return res.json({
 *       liked: !alreadyLiked,
 *       likeCount: post.likes.length
 *     });
 *   } catch (error) {
 *     console.error('Like toggle error:', error);
 *     return res.status(500).json({ message: 'Failed to toggle like' });
 *   }
 * }
 */

/**
 * 7. UPDATE PROFILE ENDPOINT
 * 
 * PATCH /api/users/me
 * Request: { name?, bio?, avatar?, location? }
 * Response: { userId, name, bio, avatar, location }
 * 
 * Rate Limit: 20 updates per hour per user
 * Error: 429 Too Many Requests after 20 updates in 60 minutes
 * 
 * Implementation:
 */

/**
 * app.patch('/api/users/me',
 *   authMiddleware,
 *   rateLimiters.updateProfile, // ← Apply profile limiter
 *   validateProfileInput,
 *   updateProfileHandler
 * );
 * 
 * async function updateProfileHandler(req, res) {
 *   try {
 *     const userId = req.user.id;
 *     const { name, bio, avatar, location } = req.body;
 *     
 *     // Find user
 *     const user = await User.findById(userId);
 *     if (!user) {
 *       return res.status(404).json({ message: 'User not found' });
 *     }
 *     
 *     // Update allowed fields only
 *     if (name !== undefined) user.name = name;
 *     if (bio !== undefined) user.bio = bio;
 *     if (avatar !== undefined) user.avatar = avatar;
 *     if (location !== undefined) user.location = location;
 *     
 *     await user.save();
 *     
 *     return res.json({
 *       userId: user.id,
 *       name: user.name,
 *       bio: user.bio,
 *       avatar: user.avatar,
 *       location: user.location
 *     });
 *   } catch (error) {
 *     console.error('Profile update error:', error);
 *     return res.status(500).json({ message: 'Failed to update profile' });
 *   }
 * }
 */

// ============================================================
// APPLICATION SETUP EXAMPLE
// ============================================================

/**
 * COMPLETE EXAMPLE - Express App Setup:
 * 
 * import express from 'express';
 * import cookieParser from 'cookie-parser';
 * import { rateLimiters } from '@/middleware/rateLimiters';
 * import { authMiddleware } from '@/middleware/auth';
 * 
 * const app = express();
 * 
 * // Middleware
 * app.use(express.json());
 * app.use(cookieParser());
 * app.set('trust proxy', 1); // Trust one proxy level
 * 
 * // Apply global rate limiter (low priority catch-all)
 * app.use(rateLimiters.global);
 * 
 * // Auth Routes (with specific rate limiters)
 * app.post('/api/auth/login', rateLimiters.login, loginHandler);
 * app.post('/api/auth/register', rateLimiters.register, registerHandler);
 * app.post('/api/auth/password-reset', rateLimiters.passwordReset, passwordResetHandler);
 * app.post('/api/auth/verify', rateLimiters.verifyToken, verifyTokenHandler);
 * 
 * // Content Routes (with auth + rate limiters)
 * app.post('/api/posts',
 *   authMiddleware,
 *   rateLimiters.createPost,
 *   createPostHandler
 * );
 * 
 * app.post('/api/posts/:postId/comments',
 *   authMiddleware,
 *   rateLimiters.createComment,
 *   createCommentHandler
 * );
 * 
 * app.post('/api/posts/:postId/like',
 *   authMiddleware,
 *   rateLimiters.like,
 *   toggleLikeHandler
 * );
 * 
 * app.patch('/api/users/me',
 *   authMiddleware,
 *   rateLimiters.updateProfile,
 *   updateProfileHandler
 * );
 * 
 * // Health check (not rate limited)
 * app.get('/health', (req, res) => {
 *   res.json({ status: 'ok' });
 * });
 * 
 * // Start server
 * app.listen(3001, () => {
 *   console.log('✓ Server running on port 3001');
 *   console.log('✓ Rate limiting enabled');
 * });
 */

// ============================================================
// ERROR HANDLING EXAMPLES
// ============================================================

/**
 * RATE LIMIT ERROR RESPONSE:
 * 
 * When limit is exceeded, client receives:
 * 
 * HTTP 429 Too Many Requests
 * {
 *   "status": "error",
 *   "code": "RATE_LIMIT_EXCEEDED",
 *   "message": "Too many requests to /api/auth/login. Please try again later.",
 *   "retryAfter": 60,
 *   "limit": "5",
 *   "remaining": "0",
 *   "reset": "1645084200000"
 * }
 * 
 * Headers:
 * RateLimit-Limit: 5
 * RateLimit-Remaining: 0
 * RateLimit-Reset: 1645084200
 * Retry-After: 60
 */

/**
 * CLIENT HANDLING EXAMPLE (Frontend):
 * 
 * async function loginWithRetry(email, password) {
 *   try {
 *     const response = await fetch('https://api.vairo.app/api/auth/login', {
 *       method: 'POST',
 *       body: JSON.stringify({ email, password })
 *     });
 *     
 *     if (response.status === 429) {
 *       const error = await response.json();
 *       const retryAfter = error.retryAfter || 60;
 *       throw new Error(`Too many attempts. Try again in ${retryAfter} seconds.`);
 *     }
 *     
 *     return await response.json();
 *   } catch (error) {
 *     console.error(error);
 *     throw error;
 *   }
 * }
 */

export {};
