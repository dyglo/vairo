import { Stack } from 'expo-router';

export default function AdminLayout() {
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
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Manage Users',
        }}
      />
      <Stack.Screen
        name="roles"
        options={{
          title: 'Manage Roles',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'System Settings',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
    </Stack>
  );
}
