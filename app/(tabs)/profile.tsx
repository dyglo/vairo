import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileTabs } from '@/components/ProfileTabs';
import { MediaGrid } from '@/components/MediaGrid';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
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

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {currentUser ? (
          <>
            <ProfileHeader user={currentUser} isCurrentUser />
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <MediaGrid posts={getDisplayPosts()} />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Please log in to view your profile</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
