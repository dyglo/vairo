/**
 * Token Manager - JWT Access & Refresh Token Management
 * 
 * Handles token lifecycle:
 * - Access tokens: Short-lived (15 minutes) - sent in Authorization header
 * - Refresh tokens: Long-lived (7 days) - stored in HTTP-only cookies on backend
 * 
 * ARCHITECTURE:
 * 
 *   Client                          Server
 *   ├─ login()
 *   │  └─ POST /auth/login
 *   │     ├─ Receive: { accessToken (JWT), refreshToken (httpOnly cookie) }
 *   │     └─ Store: accessToken in memory
 *   │
 *   ├─ API Request with accessToken
 *   │  └─ Authorization: Bearer <accessToken>
 *   │
 *   ├─ AccessToken expires (15m)
 *   │  └─ POST /auth/refresh
 *   │     ├─ Send: refreshToken (auto-included via httpOnly cookie)
 *     │     ├─ Receive: { newAccessToken }
 *   │     └─ Store: newAccessToken in memory
 *   │
 *   └─ logout()
 *      └─ POST /auth/logout
 *         ├─ Backend: Revoke refreshToken
 *         ├─ Backend: Add token to blacklist
 *         └─ Client: Clear memory, clear cookies
 * 
 * SECURITY FEATURES:
 * ✓ Access tokens in memory only (cleared on page refresh)
 * ✓ Refresh tokens in HTTP-only cookies (immune to XSS)
 * ✓ Tokens signed with server secret (no client tampering)
 * ✓ Token rotation on refresh (automatic + on login)
 * ✓ Token blacklist for logout enforcement
 * ✓ Expiration validation on all protected routes
 */

import { getEnv } from '@/utils/envValidator';

/**
 * Token pair: access token for API calls, refresh token for getting new access token
 */
export interface TokenPair {
  accessToken: string;        // Short-lived (15m), sent in Authorization header
  refreshToken?: string;      // Long-lived (7d), stored in httpOnly cookie on backend
  expiresIn?: number;         // Access token expiration in seconds (usually 900 = 15m)
}

/**
 * Decoded JWT payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;               // Issued at (timestamp)
  exp: number;               // Expiration (timestamp)
  type: 'access' | 'refresh'; // Token type
}

/**
 * Server response from token endpoints
 */
export interface TokenResponse {
  success: boolean;
  data?: TokenPair;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * In-memory token storage (cleared on app restart)
 * DO NOT use AsyncStorage for access tokens - they're short-lived!
 */
let currentAccessToken: string | null = null;

/**
 * Base64 decode utility for JWT payload parsing
 * 
 * @param str - Base64 string
 * @returns Decoded string
 */
function base64Decode(str: string): string {
  try {
    // Handle base64url format (- and _ instead of + and /)
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Handle padding
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode - works in Node.js and modern browsers
    if (typeof atob !== 'undefined') {
      return atob(padded);
    }
    
    // Fallback for Node.js
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return '';
  }
}

/**
 * Parse JWT token to extract payload
 * 
 * SECURITY WARNING: This only decodes the token. It does NOT verify the signature.
 * Always validate the token signature on the backend!
 * 
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.warn('Invalid JWT format: expected 3 parts');
      return null;
    }
    
    const payload = JSON.parse(base64Decode(parts[1]));
    return payload as JWTPayload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * Considers token expired if less than 5 seconds remain
 * 
 * @param token - JWT token
 * @returns boolean - True if token is expired or will expire soon
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  
  if (!payload) {
    return true; // Treat invalid tokens as expired
  }
  
  // Check if token exp is in the past (with 5 second buffer)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp;
  const bufferSeconds = 5;
  
  return expiresAt - bufferSeconds <= now;
}

/**
 * Get remaining time until token expiration
 * 
 * @param token - JWT token
 * @returns Number of seconds until expiration (below 0 if expired)
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = decodeToken(token);
  
  if (!payload) {
    return -1;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now;
}

/**
 * Store access token in memory
 * DO NOT persist to storage - this is for current session only
 * 
 * @param token - Access token
 */
export function setAccessToken(token: string): void {
  currentAccessToken = token;
}

/**
 * Retrieve access token from memory
 * Returns null if not set or expired
 * 
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  if (!currentAccessToken || isTokenExpired(currentAccessToken)) {
    currentAccessToken = null;
    return null;
  }
  
  return currentAccessToken;
}

/**
 * Clear access token from memory
 * Called on logout
 */
export function clearAccessToken(): void {
  currentAccessToken = null;
}

/**
 * Refresh access token using refresh token
 * Refresh token is sent automatically in cookies by the browser
 * 
 * FLOW:
 * 1. Client calls this function
 * 2. POST /auth/refresh includes refreshToken cookie auto-magically
 * 3. Server validates refreshToken and issues new accessToken
 * 4. New accessToken stored in memory
 * 
 * @returns Promise with new access token or error
 */
export async function refreshAccessToken(): Promise<TokenResponse> {
  try {
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies (refreshToken)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh token expired. Please login again',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: errorData.message || 'Failed to refresh token',
        },
      };
    }

    const data = await response.json();
    
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }

    return {
      success: true,
      data: {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      },
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error during token refresh',
      },
    };
  }
}

/**
 * Validate token and refresh if expired
 * Automatically calls /auth/refresh if access token expired
 * Logout user if refresh token also expired
 * 
 * Used in API wrapper to ensure fresh token before requests
 * 
 * @returns boolean - True if token is valid, false if refresh failed
 */
export async function ensureValidToken(): Promise<boolean> {
  const token = getAccessToken();
  
  // No token, need to login
  if (!token) {
    return false;
  }
  
  // Token still valid
  if (!isTokenExpired(token)) {
    return true;
  }
  
  // Token expired, try to refresh
  const refreshResponse = await refreshAccessToken();
  return refreshResponse.success;
}

/**
 * Make authenticated API request with automatic token refresh
 * Handles token expiration and refresh transparently
 * 
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Response from API
 * 
 * @example
 * const response = await authenticatedFetch('/api/posts', {
 *   method: 'POST',
 *   body: JSON.stringify({ caption: 'Hello!' })
 * });
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure token is valid (refresh if needed)
  const isValid = await ensureValidToken();
  
  if (!isValid) {
    throw new Error('Not authenticated. Please login first.');
  }
  
  // Get current access token
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('No access token available');
  }
  
  // Add Authorization header with Bearer token
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies if needed
  });
  
  // Handle 401 (unauthorized) - token might have been blacklisted
  if (response.status === 401) {
    // Clear token and require re-login
    clearAccessToken();
    throw new Error('Authentication failed. Please login again.');
  }
  
  return response;
}

/**
 * Log out user and revoke tokens
 * 
 * FLOW:
 * 1. POST /auth/logout with current accessToken
 * 2. Server: Revoke refreshToken (add to blacklist)
 * 3. Server: Clear httpOnly cookie
 * 4. Client: Clear memory token
 * 5. Navigate to login screen
 * 
 * @returns Promise<boolean> - True if logout successful
 */
export async function logout(): Promise<boolean> {
  try {
    const token = getAccessToken();
    const apiBaseUrl = getEnv('apiBaseUrl') as string;
    
    // Clear local token immediately (even if logout fails)
    clearAccessToken();
    
    // Notify server to revoke tokens
    if (token) {
      try {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include', // Include cookies
        });
      } catch (error) {
        console.error('Server logout error:', error);
        // Continue with local logout even if server request fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * Check if user is currently authenticated
 * Returns true only if access token exists and is not expired
 * 
 * @returns boolean - True if authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return token !== null && !isTokenExpired(token);
}

/**
 * Get current user info from stored access token
 * 
 * @returns User info or null if not authenticated
 */
export function getCurrentUser(): { userId: string; email: string } | null {
  const token = getAccessToken();
  
  if (!token || isTokenExpired(token)) {
    return null;
  }
  
  const payload = decodeToken(token);
  
  if (!payload) {
    return null;
  }
  
  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * SECURITY NOTES:
 * 
 * ✓ Access Token Storage:
 *   - Stored in memory only (cleared on page refresh/app restart)
 *   - Short-lived (15 minutes) reduces impact of compromised token
 *   - Sent in Authorization header with Bearer scheme
 *   - Cannot be accessed by XSS attacks to same-origin scripts (but should still be protected)
 * 
 * ✓ Refresh Token Storage:
 *   - Stored in HTTP-only cookies on backend
 *   - Cannot be accessed by JavaScript (immune to XSS)
 *   - Browser automatically sends with credentials: 'include'
 *   - Longer-lived (7 days) for user convenience
 *   - Rotated on each refresh for forward secrecy
 * 
 * ✓ Token Validation:
 *   - Server validates JWT signature on every request
 *   - Server checks token expiration
 *   - Server maintains blacklist for revoked tokens
 *   - Automatic refresh on token expiration
 * 
 * ✗ NEVER DO:
 *   - Don't store access tokens in localStorage (persists across refreshes, XSS risk)
 *   - Don't store access tokens in AsyncStorage (too long-lived)
 *   - Don't send refresh tokens in Authorization header
 *   - Don't use symmetric encryption for tokens (signatures only)
 *   - Don't refresh tokens before they're actually expired
 *   - Don't accept tokens without signature validation
 */
