import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/context/AppContext';
import { useAuthMiddleware } from '@/hooks/useAuthMiddleware';

/**
 * Root layout with auth-aware routing
 * Conditionally shows login or main app based on authentication state
 */
function RootLayoutNav() {
  useFrameworkReady();
  const { isLoading } = useAuthMiddleware();

  if (isLoading) {
    return null;
  }

  return (
    <Stack initialRouteName="login" screenOptions={{ headerShown: false }}>
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
