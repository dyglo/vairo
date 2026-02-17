import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Settings } from 'lucide-react-native';
import { formatNumber } from '@/utils/feedAlgorithm';
import { useApp } from '@/context/AppContext';

interface ProfileHeaderProps {
  user: any;
  isCurrentUser?: boolean;
}

export function ProfileHeader({ user, isCurrentUser = false }: ProfileHeaderProps) {
  const { isFollowing, toggleFollow } = useApp();
  
  if (!user) return null;
  
  const following = isFollowing(user.id);

  const handleFollowPress = () => {
    toggleFollow(user.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>
        <View style={styles.rightSection}>
          {isCurrentUser ? (
            <TouchableOpacity style={styles.settingsBtn}>
              <Settings size={22} color="#333" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={handleFollowPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                {following ? 'Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <View style={styles.occupationRow}>
          <Text style={styles.occupation}>{user.occupation || user.bio}</Text>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={14} color="#FF4D4D" />
          <Text style={styles.location}>{user.location}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(user.posts_count)}</Text>
          <Text style={styles.statLabel}>Post</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(user.followers_count)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(user.following_count)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatNumber(user.likes_count)}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    borderWidth: 3,
    borderColor: '#FFD400',
    borderRadius: 50,
    padding: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  rightSection: {
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  settingsBtn: {
    padding: 8,
  },
  followBtn: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: '#f0f0f0',
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  followingBtnText: {
    color: '#666',
  },
  infoSection: {
    marginTop: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  occupationRow: {
    marginTop: 8,
  },
  occupation: {
    fontSize: 14,
    color: '#333',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f0f0f0',
  },
});
