/**
 * useTokenRefresh Hook - Automatic token refresh
 * 
 * Automatically refreshes access token before expiration
 * Handles token refresh failures gracefully
 * 
 * @usage
 * import { useTokenRefresh } from '@/hooks/useTokenRefresh';
 * 
 * function MyComponent() {
 *   const { isRefreshing } = useTokenRefresh();
 *   
 *   return <Text>{isRefreshing ? 'Refreshing...' : 'Ready'}</Text>;
 * }
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/utils/authAPI';

interface UseTokenRefreshOptions {
  bufferTime?: number; // Time before expiration to refresh (default: 60 seconds)
  checkInterval?: number; // How often to check token expiration (default: 30 seconds)
}

/**
 * Hook to automatically refresh access token
 * 
 * Strategy:
 * 1. On login, calculate token expiration time
 * 2. Set up interval to check token expiration
 * 3. When token will expire soon, request new token
 * 4. Update auth state with new token
 * 5. On logout, clear the interval
 */
export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const { bufferTime = 60, checkInterval = 30 } = options;
  const { auth, login: updateAuth } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Refresh access token
   */
  const refreshAccessToken = useCallback(async () => {
    // Prevent multiple simultaneous refresh requests
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setIsRefreshing(true);
    setLastRefreshError(null);

    const refreshPromise = (async () => {
      try {
        const response = await authAPI.refreshToken();

        if (!auth) {
          throw new Error('Authentication state not available');
        }

        // Update auth state with new token
        // Note: This is a simplified approach
        // In production, you might want to use a more sophisticated update mechanism
        localStorage.setItem('accessToken', response.accessToken);

        setIsRefreshing(false);
        setLastRefreshError(null);
      } catch (error: any) {
        setIsRefreshing(false);
        const errorMessage = error.message || 'Token refresh failed';
        setLastRefreshError(errorMessage);

        // If refresh fails with auth error, logout
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.warn('Token refresh failed with auth error, user needs to login again');
          // Clear auth on refresh failure
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('accessToken');
          }
        }

        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [auth]);

  /**
   * Check if token should be refreshed
   */
  const shouldRefreshToken = useCallback((): boolean => {
    if (!auth?.expiresIn) {
      return false;
    }

    // Token should be refreshed bufferTime seconds before actual expiration
    const timeUntilExpiration = auth.expiresIn * 1000; // Convert to milliseconds
    return timeUntilExpiration < bufferTime * 1000;
  }, [auth?.expiresIn, bufferTime]);

  /**
   * Set up token refresh interval
   */
  useEffect(() => {
    // Only set up interval if authenticated
    if (!auth?.accessToken) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Set up interval to check token expiration
    refreshIntervalRef.current = setInterval(() => {
      if (shouldRefreshToken() && !isRefreshing) {
        console.log('Access token expiring soon, refreshing...');
        refreshAccessToken().catch(error => {
          console.error('Failed to refresh token:', error);
        });
      }
    }, checkInterval * 1000);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [auth?.accessToken, shouldRefreshToken, isRefreshing, refreshAccessToken, checkInterval]);

  /**
   * Manually trigger token refresh
   */
  const refresh = useCallback(async () => {
    return refreshAccessToken();
  }, [refreshAccessToken]);

  return {
    isRefreshing,
    lastRefreshError,
    refresh,
    shouldRefreshToken: shouldRefreshToken(),
  };
}

export default useTokenRefresh;
