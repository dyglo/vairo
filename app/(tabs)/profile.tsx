import React, { useState } from 'react';
import { Alert, View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileTabs } from '@/components/ProfileTabs';
import { MediaGrid } from '@/components/MediaGrid';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'videos'>('posts');

  const userPosts: any[] = [];
  const mediaPosts = userPosts.filter(post => post.media_url);
  const videoPosts = userPosts.filter(post => post.type === 'video');

  const getDisplayPosts = () => {
    switch (activeTab) {
      case 'videos':
        return videoPosts;
      case 'saved':
        return [];
      default:
        return mediaPosts;
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const openSettings = () => {
    Alert.alert('Settings', 'Manage your account', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void handleLogout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <ProfileHeader user={currentUser} isCurrentUser onSettingsPress={openSettings} />
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <MediaGrid posts={getDisplayPosts()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
