/**
 * Authentication Middleware Hook
 * 
 * Handles authentication state restoration and provides loading state
 */

import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

/**
 * useAuthMiddleware - Manages auth-based routing
 * Should be called in root layout to handle authenticated vs unauthenticated flows
 */
export function useAuthMiddleware() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated and trying to access protected route, redirect to login
      const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'admin' || segments[0] === 'moderation';

      if (!isAuthenticated && inAuthGroup) {
        router.replace('/login');
      } else if (isAuthenticated && segments[0] === 'login') {
        // If authenticated and on login screen, go to home
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  // Simulate app initialization/loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return { isLoading };
}
