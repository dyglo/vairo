import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, User, Play, Circle } from 'lucide-react-native';

function TabBarIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const iconSize = 24;

  switch (name) {
    case 'home':
      return <Home size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
    case 'search':
      return <Search size={iconSize} color={color} />;
    case 'reels':
      return (
        <View style={[styles.reelsIconContainer, { borderColor: color }]}>
          <Play size={16} color={color} fill={color} />
        </View>
      );
    case 'profile':
      return <User size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
    default:
      return null;
  }
}

function MessagesBadge({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.messagesContainer}>
      <Circle size={24} color={color} fill={focused ? color : 'transparent'} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>5</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
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
        name="reels"
        options={{
          title: 'Reels',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="reels" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessagesBadge color={color} focused={focused} />
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
  messagesContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reelsIconContainer: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
