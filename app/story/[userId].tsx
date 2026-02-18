import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronUp, Heart, Send } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { formatTimeAgo } from '@/utils/feedAlgorithm';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

type Story = {
  id: string;
  media_url: string;
  created_at: string;
};

type GroupedStory = {
  user_id: string;
  stories: Story[];
};

export default function StoryViewerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { getUser, markStorySeen, isFollowing, toggleFollow } = useApp();

  // TODO: replace with real grouped stories from your context or API
  const groupedStories: GroupedStory[] = [];

  const userStoryIndex = groupedStories.findIndex(g => g.user_id === userId);
  const [currentUserIndex, setCurrentUserIndex] = useState(
    userStoryIndex >= 0 ? userStoryIndex : 0
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [replyText, setReplyText] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentUserStories = groupedStories[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];
  const storyUser = currentUserStories ? getUser(currentUserStories.user_id) : null;
  const following = storyUser ? isFollowing(storyUser.id) : false;

  const goToNextStory = useCallback(() => {
    if (!currentUserStories) return;

    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      router.back();
    }
  }, [currentStoryIndex, currentUserIndex, currentUserStories, groupedStories, router]);

  const goToPreviousStory = useCallback(() => {
    if (!currentUserStories) return;

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      const prevUserStories = groupedStories[currentUserIndex - 1];
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(prevUserStories.stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, currentUserStories, groupedStories]);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished) goToNextStory();
    });
  }, [progressAnim, goToNextStory]);

  const stopProgress = useCallback(() => {
    animationRef.current?.stop();
  }, []);

  useEffect(() => {
    if (currentStory) {
      markStorySeen(currentStory.id);
      startProgress();
    }
    return () => stopProgress();
  }, [currentStory?.id, markStorySeen, startProgress, stopProgress]);

  const handleTap = (event: { nativeEvent: { locationX: number } }) => {
    const tapX = event.nativeEvent.locationX;
    if (tapX < width / 3) goToPreviousStory();
    else goToNextStory();
  };

  const handleFollowPress = () => {
    if (storyUser) toggleFollow(storyUser.id);
  };

  if (!currentStory || !storyUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Story not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const storyCount = currentUserStories?.stories.length || 0;

  return (
    <View style={styles.container}>
      <Pressable style={styles.storyContent} onPress={handleTap}>
        <Image
          source={{ uri: currentStory.media_url }}
          style={styles.storyImage}
          resizeMode="cover"
        />

        <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
          <View style={styles.progressContainer}>
            {Array.from({ length: storyCount }).map((_, index) => (
              <View key={index} style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width:
                        index < currentStoryIndex
                          ? '100%'
                          : index === currentStoryIndex
                          ? progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            })
                          : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={{ uri: storyUser.avatar }} style={styles.avatar} />
              <View style={styles.userMeta}>
                <Text style={styles.userName}>{storyUser.name}</Text>
                <Text style={styles.timeAgo}>
                  {formatTimeAgo(currentStory.created_at)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followingBtn]}
              onPress={handleFollowPress}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                {following ? 'Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.storyMentionContainer}>
            <Text style={styles.storyMention}>@{storyUser.username}</Text>
          </View>
        </View>

        <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Send size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Heart size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Reply Story..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={replyText}
              onChangeText={setReplyText}
            />
            <TouchableOpacity style={styles.sendBtn}>
              <ChevronUp size={24} color="#FFD400" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// --- keep your styles unchanged ---
