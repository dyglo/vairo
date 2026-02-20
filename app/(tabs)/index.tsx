import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Plus } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { StoriesRow } from '@/components/StoriesRow';
import { PostCard } from '@/components/PostCard';
import { rankFeedPosts } from '@/utils/feedAlgorithm';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { posts } = useApp();

  const rankedPosts = rankFeedPosts(posts);

  const renderHeader = () => (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.createBtn}>
            <Plus size={28} color="#1a1a1a" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Vairo</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={24} color="#1a1a1a" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <StoriesRow />
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={rankedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerBtn: {
    padding: 4,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  createBtn: {
    padding: 8,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
});
