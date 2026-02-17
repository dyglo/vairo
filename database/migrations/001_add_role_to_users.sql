/**
 * Database Migration: Add role field to users table
 * 
 * This migration adds role-based access control (RBAC) support to the users table.
 * 
 * Roles:
 * - user: Regular user (default)
 * - moderator: Can moderate content and users
 * - admin: Has full system access
 * 
 * Run this migration on your database to support RBAC.
 */

-- PostgreSQL
-- ============================================================

-- 1. Add role column with default value
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- 2. Add constraint to ensure only valid roles
ALTER TABLE users ADD CONSTRAINT check_valid_role CHECK (role IN ('user', 'moderator', 'admin'));

-- 3. Create index for role queries (useful for finding admins/moderators)
CREATE INDEX idx_users_role ON users(role);

-- 4. Set initial admin users (update this with your actual admin user IDs)
-- Example:
-- UPDATE users SET role = 'admin' WHERE id = 'your-admin-user-id';
-- UPDATE users SET role = 'moderator' WHERE id IN ('moderator1', 'moderator2');


-- MySQL
-- ============================================================

-- 1. Add role column with default value
-- ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- 2. Add constraint to ensure only valid roles
-- ALTER TABLE users ADD CONSTRAINT check_valid_role CHECK (role IN ('user', 'moderator', 'admin'));

-- 3. Create index for role queries
-- CREATE INDEX idx_users_role ON users(role);

-- 4. Set initial admin users
-- UPDATE users SET role = 'admin' WHERE id = 'your-admin-user-id';


-- SQLite
-- ============================================================

-- 1. Add role column with default value
-- ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- 2. SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so add during table creation
-- You may need to:
-- 1. Create new table with role column
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- 3. Create index
-- CREATE INDEX idx_users_role ON users(role);


-- Rollback (PostgreSQL)
-- ============================================================

-- DROP INDEX IF EXISTS idx_users_role;
-- ALTER TABLE users DROP CONSTRAINT check_valid_role;
-- ALTER TABLE users DROP COLUMN role;


-- Rollback (MySQL)
-- ============================================================

-- DROP INDEX idx_users_role ON users;
-- ALTER TABLE users DROP CHECK check_valid_role;
-- ALTER TABLE users DROP COLUMN role;
