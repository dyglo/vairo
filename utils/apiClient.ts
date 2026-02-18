// utils/apiClient.ts
import { AuthCredentials, AuthResponse, UserSession, AuthError, TokenPair } from './types';
import { getEnv } from '@/utils/envValidator';
import { authenticatedFetch, getAccessToken } from './tokenManager';
import { login as authLogin, register as authRegister } from './authentication';

/**
 * API Client
 * Handles user authentication and API requests with automatic token refresh
 */
export const apiClient = {
  /**
   * Register a new user
   */
  register: async (credentials: AuthCredentials): Promise<AuthResponse<{ userId: string; email: string }>> => {
    return await authRegister(credentials);
  },

  /**
   * Login a user
   */
  login: async (credentials: AuthCredentials): Promise<AuthResponse<UserSession>> => {
    return await authLogin(credentials);
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<boolean> => {
    // Using tokenManager.logout internally
    try {
      const { logout } = await import('./tokenManager');
      return await logout();
    } catch (err) {
      console.error('API logout error:', err);
      return false;
    }
  },

  /**
   * Generic GET request with auth
   */
  get: async <T = any>(endpoint: string): Promise<T> => {
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const res = await authenticatedFetch(`${apiBaseUrl}${endpoint}`, { method: 'GET' });
    return await res.json() as T;
  },

  /**
   * Generic POST request with auth
   */
  post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    const res = await authenticatedFetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json() as T;
  },

  /**
   * Get the current user info from access token
   */
  getCurrentUser: (): { userId: string; email: string } | null => {
    const { getCurrentUser } = require('./tokenManager');
    return getCurrentUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const { isAuthenticated } = require('./tokenManager');
    return isAuthenticated();
  },
};
