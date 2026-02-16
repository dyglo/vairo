import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Play } from 'lucide-react-native';
import { formatNumber } from '@/utils/feedAlgorithm';

interface MediaGridProps {
  posts: any[];
  onPostPress?: (post: any) => void;
}

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const ITEM_SIZE = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export function MediaGrid({ posts, onPostPress }: MediaGridProps) {
  const mediaPosts = posts.filter(post => post.media_url);

  return (
    <View style={styles.container}>
      {mediaPosts.map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={[
            styles.gridItem,
            {
              marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : GRID_GAP,
              marginBottom: GRID_GAP,
            },
          ]}
          onPress={() => onPostPress?.(post)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: post.media_url }} style={styles.media} />
          {post.type === 'video' && (
            <View style={styles.videoOverlay}>
              <Play size={20} color="#fff" fill="#fff" />
              <Text style={styles.viewCount}>{formatNumber(post.likes)}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
