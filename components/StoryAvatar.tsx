import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '@/context/AppContext';

interface StoryAvatarProps {
  user: any;
  isCurrentUser?: boolean;
  onPress: () => void;
  size?: 'small' | 'large';
}

export function StoryAvatar({ user, isCurrentUser = false, onPress, size = 'small' }: StoryAvatarProps) {
  const { hasUnseenStories } = useApp();

  if (!user) return null;

  const hasUnseen = hasUnseenStories(user.id);

  const avatarSize = size === 'large' ? 72 : 64;
  const borderWidth = size === 'large' ? 3 : 2.5;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.avatarBorder,
          {
            width: avatarSize + borderWidth * 2 + 4,
            height: avatarSize + borderWidth * 2 + 4,
            borderWidth: borderWidth,
            borderColor: hasUnseen || isCurrentUser ? '#FFD400' : '#E0E0E0',
          },
        ]}
      >
        <Image
          source={{ uri: user.avatar }}
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {isCurrentUser ? 'You' : user.name.split(' ')[0].toLowerCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
    marginRight: 8,
  },
  avatarBorder: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  username: {
    marginTop: 6,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
});
