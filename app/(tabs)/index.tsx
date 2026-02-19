import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        <Text style={styles.headerTitle}>Vairo</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  listContent: {
    paddingBottom: 20,
  },
});
