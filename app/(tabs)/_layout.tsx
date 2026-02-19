import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Bell, User, Plus, MessageCircle, Film } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';

function TabBarIcon({ name, color, focused, badgeCount }: { name: string; color: string; focused: boolean; badgeCount?: number }) {
  const iconSize = 24;

  const iconComponent = (() => {
    switch (name) {
      case 'home':
        return <Home size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
      case 'search':
        return <Search size={iconSize} color={color} />;
      case 'messages':
        return <MessageCircle size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
      case 'reel':
        return <Film size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
      case 'notifications':
        return <Bell size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
      case 'profile':
        return <User size={iconSize} color={color} fill={focused ? color : 'transparent'} />;
      default:
        return null;
    }
  })();

  return (
    <View style={styles.iconContainer}>
      {iconComponent}
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
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

export default function TabLayout() {
  const { getUnreadMessagesCount } = useApp();
  const unreadCount = getUnreadMessagesCount();

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
        name="reel"
        options={{
          title: 'Reels',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="reel" color={color} focused={focused} />
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
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="messages" color={color} focused={focused} badgeCount={unreadCount} />
          ),
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
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
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
