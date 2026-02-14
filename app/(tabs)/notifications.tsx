import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { formatTimeAgo } from '@/utils/feedAlgorithm';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  userId: string;
  postId?: string;
  timestamp: string;
}

const mockNotifications: Notification[] = [
  { id: 'n1', type: 'like', userId: 'user-7', postId: 'post-1', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 'n2', type: 'follow', userId: 'user-10', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'n3', type: 'comment', userId: 'user-3', postId: 'post-2', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'n4', type: 'like', userId: 'user-8', postId: 'post-4', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: 'n5', type: 'follow', userId: 'user-13', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 'n6', type: 'like', userId: 'user-4', postId: 'post-1', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: 'n7', type: 'comment', userId: 'user-14', postId: 'post-16', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: 'n8', type: 'follow', userId: 'user-6', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n9', type: 'like', userId: 'user-9', postId: 'post-8', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() },
  { id: 'n10', type: 'like', userId: 'user-11', postId: 'post-19', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getUser, posts, isFollowing, toggleFollow } = useApp();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} color="#FF4D4D" fill="#FF4D4D" />;
      case 'comment':
        return <MessageCircle size={16} color="#0066CC" />;
      case 'follow':
        return <UserPlus size={16} color="#FFD400" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification, userName: string) => {
    switch (notification.type) {
      case 'like':
        return <Text style={styles.notificationText}><Text style={styles.userName}>{userName}</Text> liked your post</Text>;
      case 'comment':
        return <Text style={styles.notificationText}><Text style={styles.userName}>{userName}</Text> commented on your post</Text>;
      case 'follow':
        return <Text style={styles.notificationText}><Text style={styles.userName}>{userName}</Text> started following you</Text>;
      default:
        return null;
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const user = getUser(item.userId);
    if (!user) return null;

    const post = item.postId ? posts.find(p => p.id === item.postId) : null;
    const following = isFollowing(user.id);

    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => handleUserPress(user.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={styles.notificationContent}>
          <View style={styles.iconRow}>
            {getNotificationIcon(item.type)}
            <Text style={styles.time}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
          {getNotificationText(item, user.name)}
        </View>
        {item.type === 'follow' ? (
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={() => toggleFollow(user.id)}
          >
            <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        ) : post?.media_url ? (
          <Image source={{ uri: post.media_url }} style={styles.postThumbnail} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  userName: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginLeft: 12,
  },
  followBtn: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 12,
  },
  followingBtn: {
    backgroundColor: '#f0f0f0',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  followingBtnText: {
    color: '#666',
  },
});
