import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileTabs } from '@/components/ProfileTabs';
import { MediaGrid } from '@/components/MediaGrid';

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getUser } = useApp();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'videos'>('posts');

  const user = getUser(id);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

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
      <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={28} color="#1a1a1a" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader user={user} />
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
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});
