import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Bell, User, Plus } from 'lucide-react-native';

function TabBarIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const iconSize = 24;

  switch (name) {
    case 'home':
      return <Home size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
    case 'search':
      return <Search size={iconSize} color={color} />;
    case 'notifications':
      return <Bell size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
    case 'profile':
      return <User size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
    default:
      return null;
  }
}

function CreateButton() {
  return (
    <View style={styles.createButtonContainer}>
      <TouchableOpacity style={styles.createButton} activeOpacity={0.8}>
        <Plus size={28} color="#1a1a1a" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#1a1a1a',
          tabBarInactiveTintColor: '#888',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="search" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: () => <CreateButton />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="notifications" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="profile" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFD400',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
