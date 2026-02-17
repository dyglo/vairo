/**
 * User Model - TypeScript type definitions
 * 
 * Defines the structure of User records in the database
 * with support for role-based access control
 */

/**
 * User roles for RBAC
 * - user: Regular user
 * - moderator: Can moderate content and users
 * - admin: Has full system access
 */
export type UserRole = 'user' | 'moderator' | 'admin';

/**
 * User database record
 */
export interface User {
  // Core identity
  id: string;
  email: string;
  passwordHash: string;

  // Optional profile information
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;

  // Role-based access control
  role: UserRole;

  // Account status
  isActive: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  // Optional fields
  verifiedEmail?: boolean;
  emailVerifiedAt?: Date;
  phoneNumber?: string;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName?: string;
  role?: UserRole; // Defaults to 'user'
}

/**
 * User update input
 */
export interface UpdateUserInput {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: UserRole; // Only admins can change this
  isActive?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
}

/**
 * User response (public data only - no passwordHash)
 */
export interface UserResponse {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: UserRole;
  isActive: boolean;
  isSuspended?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * User with authentication token
 * Returned by login endpoint
 */
export interface UserWithToken extends UserResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * User payload in JWT token
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

/**
 * User object attached to authenticated requests
 * Set by authMiddleware
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Convert User database record to public response
 * @param user - User from database
 * @returns User data safe to send to client
 */
export function userToResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
    website: user.website,
    role: user.role,
    isActive: user.isActive,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Validate user role
 * @param role - Role to validate
 * @returns boolean
 */
export function isValidUserRole(role: any): role is UserRole {
  return typeof role === 'string' && ['user', 'moderator', 'admin'].includes(role);
}

/**
 * Get role display name
 * @param role - User role
 * @returns Human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    user: 'User',
    moderator: 'Moderator',
    admin: 'Administrator',
  };
  return names[role];
}
