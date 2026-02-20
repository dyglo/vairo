import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { posts } = useApp();

  // Filter posts that have video type
  const reels = posts.filter((post) => post.type === 'video');

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.headerTitle}>Reels</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {reels.length === 0 ? (
        <View style={[styles.emptyContainer, { paddingTop: insets.top + 50 }]}>
          <Text style={styles.emptyText}>No reels yet</Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reelCard}>
              <Text style={styles.reelText}>{item.caption || 'Reel'}</Text>
            </View>
          )}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  listContent: {
    paddingHorizontal: 0,
  },
  reelCard: {
    height: 600,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
});
