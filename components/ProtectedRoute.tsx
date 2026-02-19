/**
 * Protected Route Guards - Role-based access control for screens
 * 
 * Provides components to protect screens based on authentication and role
 */

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';

import { Redirect, useRootNavigationState } from 'expo-router';

/**
 * ProtectedRoute - Requires authentication
 * Redirects to login if not authenticated
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigationState = useRootNavigationState();

  // Wait for navigation state to be ready before redirecting
  // This prevents the "Attempted to navigate before mounting" error
  if (!navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={"/login" as any} />;
  }

  return <>{children}</>;
}

/**
 * AdminRoute - Requires admin role
 * Redirects if user doesn't have admin role
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const router = useRouter();

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
  const router = useRouter();

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
        <Text>You don't have permission to access this page.</Text>
      </View>
    );
  }

  return <>{children}</>;
}
