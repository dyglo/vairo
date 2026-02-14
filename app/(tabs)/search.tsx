import React, { useState } from 'react';
import { View, TextInput, FlatList, Image, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/feedAlgorithm';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_SIZE = (width - GRID_GAP * 2) / 3;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, users } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const mediaPosts = posts.filter(post => post.media_url);
  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const renderSearchResults = () => {
    if (searchQuery && filteredUsers.length > 0) {
      return (
        <View style={styles.searchResults}>
          {filteredUsers.map(user => (
            <TouchableOpacity
              key={user.id}
              style={styles.userResult}
              onPress={() => handleUserPress(user.id)}
            >
              <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userUsername}>@{user.username}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return null;
  };

  const renderGridItem = ({ item, index }: { item: typeof mediaPosts[0]; index: number }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        {
          marginRight: (index + 1) % 3 === 0 ? 0 : GRID_GAP,
          marginBottom: GRID_GAP,
        },
      ]}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.media_url }} style={styles.gridImage} />
      {item.type === 'video' && (
        <View style={styles.videoIndicator}>
          <Play size={14} color="#fff" fill="#fff" />
          <Text style={styles.videoViews}>{formatNumber(item.likes)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {renderSearchResults()}

      {!searchQuery && (
        <FlatList
          data={mediaPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
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
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  searchResults: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userUsername: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  gridContainer: {
    paddingTop: 2,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoViews: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
