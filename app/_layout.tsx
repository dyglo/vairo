import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { envValidator } from '@/utils/envValidator';

/**
 * Root layout with auth-aware routing
 * Conditionally shows login or main app based on authentication state
 */
function RootLayoutNav() {
  useFrameworkReady();

  // Validate environment variables on app startup
  useEffect(() => {
    try {
      envValidator.validate();
      console.log('✓ Environment variables validated at app startup');
    } catch (error) {
      console.error('✗ Environment configuration error:', error);
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="story/[userId]"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="create-story"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="admin/index"
        options={{
          headerShown: true,
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="moderation/index"
        options={{
          headerShown: true,
          title: 'Moderation Dashboard',
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AppProvider>
  );
}
