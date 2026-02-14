import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { StoryAvatar } from './StoryAvatar';
import { getUsersWithStories } from '@/data/mockStories';
import { rankStoryUsers } from '@/utils/feedAlgorithm';

export function StoriesRow() {
  const router = useRouter();
  const { currentUser, getUser } = useApp();

  const usersWithStories = getUsersWithStories();
  const rankedUserIds = rankStoryUsers(usersWithStories);

  const handleStoryPress = (userId: string) => {
    router.push(`/story/${userId}`);
  };

  const handleCurrentUserPress = () => {
    router.push('/create-story');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StoryAvatar
          user={currentUser}
          isCurrentUser
          onPress={handleCurrentUserPress}
        />
        {rankedUserIds.map(userId => {
          const user = getUser(userId);
          if (!user) return null;
          return (
            <StoryAvatar
              key={userId}
              user={user}
              onPress={() => handleStoryPress(userId)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
});
