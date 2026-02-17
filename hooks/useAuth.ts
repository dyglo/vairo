/**
 * useAuth Hook - Easy access to authentication state and methods
 * 
 * Provides authentication state and functions for the app
 */

import { useApp } from '@/context/AppContext';

export function useAuth() {
  const {
    auth,
    login,
    logout,
    isAdmin,
    isModerator,
    canModerate,
    canAdminister,
  } = useApp();

  return {
    // State
    isAuthenticated: !!auth,
    auth,
    userId: auth?.userId,
    email: auth?.email,
    role: auth?.role,
    accessToken: auth?.accessToken,

    // Methods
    login,
    logout,

    // Role checking
    isAdmin,
    isModerator,
    canModerate,
    canAdminister,
  };
}
