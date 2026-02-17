import { Stack } from 'expo-router';

export default function ModerationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Moderation Dashboard',
        }}
      />
      <Stack.Screen
        name="logs"
        options={{
          title: 'Moderation Logs',
        }}
      />
      <Stack.Screen
        name="reports"
        options={{
          title: 'Reported Content',
        }}
      />
      <Stack.Screen
        name="queue"
        options={{
          title: 'Review Queue',
        }}
      />
      <Stack.Screen
        name="warnings"
        options={{
          title: 'User Warnings',
        }}
      />
    </Stack>
  );
}
