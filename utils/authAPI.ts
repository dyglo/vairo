/**
 * Auth API Service - Authentication endpoints
 * 
 * Handles all authentication-related API calls
 * 
 * @usage
 * import { authAPI } from '@/utils/authAPI';
 * 
 * // Login
 * const response = await authAPI.login('user@example.com', 'password');
 * 
 * // Refresh token
 * const newToken = await authAPI.refreshToken();
 * 
 * // Logout
 * await authAPI.logout();
 */

import { apiClient } from '@/utils/apiClient';

export interface LoginResponse {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  accessToken: string;
  expiresIn: number; // in seconds
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Auth API Service
 */
class AuthAPI {
  /**
   * Login with email and password
   * 
   * @param email - User email
   * @param password - User password
   * @returns Login response with token and user data
   * @throws Error if login fails
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
  }

  /**
   * Refresh access token using refresh token
   * 
   * The refresh token is stored in an HTTP-only cookie
   * This endpoint will validate the refresh token and return a new access token
   * 
   * @returns New access token and expiration time
   * @throws Error if refresh fails
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh');
  }

  /**
   * Logout - Invalidate tokens
   * 
   * This endpoint will:
   * 1. Blacklist the current access token
   * 2. Invalidate the refresh token cookie
   * 3. Clear any server-side sessions
   * 
   * @throws Error if logout fails
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Logout should clear local state even if request fails
      console.error('Logout request failed:', error);
    }
  }

  /**
   * Verify token is still valid
   * 
   * Can be used on app startup to check if stored token is valid
   * 
   * @returns User data if token is valid
   * @throws Error if token is invalid or expired
   */
  async verifyToken(): Promise<{ userId: string; email: string; role: string }> {
    return apiClient.get('/auth/verify');
  }

  /**
   * Request password reset
   * 
   * @param email - User email to reset password for
   * @throws Error if request fails
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/password-reset-request', { email });
  }

  /**
   * Reset password with token
   * 
   * @param token - Reset token from email
   * @param newPassword - New password
   * @throws Error if reset fails
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/auth/password-reset', {
      token,
      newPassword,
    });
  }

  /**
   * Change password (requires authentication)
   * 
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @throws Error if change fails
   */
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();

export default authAPI;
