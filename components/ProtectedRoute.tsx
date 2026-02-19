/**
 * Protected Route Guards - Role-based access control for screens
 * 
 * Provides components to protect screens based on authentication and role
 */

import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { View, Text } from 'react-native';

/**
 * ProtectedRoute - Requires authentication
 * Redirects to login if not authenticated
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // In a real app, you'd redirect to login screen
    // For now, show loading/auth screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Authentication required. Please log in.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * AdminRoute - Requires admin role
 * Redirects if user doesn't have admin role
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Admin access only.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * ModeratorRoute - Requires moderator or higher role
 * Allows moderator and admin
 */
export function ModeratorRoute({ children }: { children: ReactNode }) {
  const { canModerate } = useAuth();

  if (!canModerate()) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Moderator access required.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * RoleBasedRoute - Custom role requirement
 * Allows specifying exactly which roles can access
 */
export function RoleBasedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: ('user' | 'moderator' | 'admin')[];
}) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>You don&apos;t have permission to access this page.</Text>
      </View>
    );
  }

  return <>{children}</>;
}
