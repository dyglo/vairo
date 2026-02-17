/**
 * Password Hashing Utility
 * Uses Argon2 for secure password hashing and verification
 * 
 * IMPORTANT: This module is designed for server-side use.
 * Do NOT use this in client-side code - always hash passwords on the server.
 * 
 * @example
 * // Server-side usage only
 * const hashedPassword = await hashPassword('user_password');
 * const isValid = await verifyPassword('user_password', hashedPassword);
 */

import argon2 from 'argon2';

/**
 * Argon2 hashing options
 * Configuration for secure password hashing
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2i, // argon2i is resistant to side-channel attacks
  memoryCost: 65536, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel threads
};

/**
 * Hash a plain text password using Argon2
 * 
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 * @throws Error if hashing fails
 * 
 * @example
 * const hashedPassword = await hashPassword('myPassword123');
 * // Store hashedPassword in database
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate password input
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }

    // Hash the password
    const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);

    return hashedPassword;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Password hashing failed:', error.message);
      throw new Error(`Failed to hash password: ${error.message}`);
    }
    throw new Error('Failed to hash password: Unknown error');
  }
}

/**
 * Verify a plain text password against a hashed password
 * 
 * @param password - The plain text password to verify
 * @param hash - The hashed password from the database
 * @returns Promise<boolean> - True if password matches, false otherwise
 * @throws Error if verification fails (not if password is wrong)
 * 
 * @example
 * const isValid = await verifyPassword('myPassword123', storedHash);
 * if (isValid) {
 *   console.log('Password is correct');
 * } else {
 *   console.log('Password is incorrect');
 * }
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!password || typeof password !== 'string') {
      return false;
    }

    if (!hash || typeof hash !== 'string') {
      throw new Error('Hash must be a non-empty string');
    }

    // Verify the password
    const isMatch = await argon2.verify(hash, password);

    return isMatch;
  } catch (error) {
    if (error instanceof Error) {
      // If it's a verification error (hash format issue), don't expose details
      if (error.message.includes('verify')) {
        console.error('Password verification error:', error.message);
        throw new Error('Invalid password hash format');
      }
      console.error('Password verification failed:', error.message);
      throw new Error(`Failed to verify password: ${error.message}`);
    }
    throw new Error('Failed to verify password: Unknown error');
  }
}

/**
 * Check if a password hash needs to be rehashed
 * Useful for migration to stronger parameters
 * 
 * @param hash - The hashed password to check
 * @returns boolean - True if hash should be updated
 */
export function shouldRehash(hash: string): boolean {
  try {
    // Argon2 hashes include encoding parameters
    // If you change ARGON2_OPTIONS, use this to identify old hashes
    // This is a basic check - a full implementation would parse the hash
    return !hash.startsWith('$argon2');
  } catch {
    return true;
  }
}

/**
 * Validate password strength
 * Returns detailed feedback on password requirements
 * 
 * @param password - The password to validate
 * @returns object with validation results
 * 
 * @example
 * const validation = validatePasswordStrength('MyPass123!');
 * if (!validation.isValid) {
 *   console.log(validation.errors); // ['Too short', 'Missing special character', etc]
 * }
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  feedback: string;
} {
  const errors: string[] = [];

  // Length check
  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Complexity checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain special characters (!@#$%^&*, etc)');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    feedback: isValid
      ? 'Password is strong'
      : `Password is weak: ${errors.join(', ')}`,
  };
}

/**
 * SECURITY WARNINGS
 * 
 * ⚠️  DO NOT USE THIS IN CLIENT-SIDE CODE ⚠️
 * 
 * 1. Never hash passwords on the client (browser/mobile)
 *    - Expose source code to users
 *    - Subject to tampering
 *    - Unreliable computation
 * 
 * 2. Always hash on the server:
 *    - Keep hashing logic secure
 *    - Use HTTPS for transmission
 *    - Implement rate limiting on login/signup
 *    - Log failed authentication attempts
 * 
 * 3. Password transmission:
 *    - Only send plain passwords over HTTPS
 *    - Never log plain passwords
 *    - Clear passwords from memory after use
 *    - Use secure channels (TLS 1.2+)
 * 
 * 4. Storage:
 *    - Store hashes only, never plain passwords
 *    - Use salted hashes (Argon2 does this automatically)
 *    - Implement password expiration policies
 *    - Support password reset functionality
 * 
 * 5. Best practices:
 *    - Implement account lockout after failed attempts
 *    - Use multi-factor authentication
 *    - Hash passwords with random salt
 *    - Never use MD5, SHA1, or unsalted hashing
 *    - Update hashes when security parameters improve
 */
