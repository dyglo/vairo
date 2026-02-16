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

export default function StoryViewerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { getUser, markStorySeen, isFollowing, toggleFollow } = useApp();

  const groupedStories: any[] = [];
  const userStoryIndex = groupedStories.findIndex(g => g.user_id === userId);
  const [currentUserIndex, setCurrentUserIndex] = useState(userStoryIndex >= 0 ? userStoryIndex : 0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [replyText, setReplyText] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentUserStories = groupedStories[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];
  const storyUser = currentUserStories ? getUser(currentUserStories.user_id) : null;
  const following = storyUser ? isFollowing(storyUser.id) : false;

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  }, [currentStoryIndex, currentUserIndex]);

  const stopProgress = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
  }, []);

  useEffect(() => {
    if (currentStory) {
      markStorySeen(currentStory.id);
      startProgress();
    }
    return () => stopProgress();
  }, [currentStory?.id, startProgress, stopProgress]);

  const goToNextStory = () => {
    if (currentStoryIndex < (currentUserStories?.stories.length || 0) - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      router.back();
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUserStories = groupedStories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUserStories.stories.length - 1);
    }
  };

  const handleTap = (event: { nativeEvent: { locationX: number } }) => {
    const tapX = event.nativeEvent.locationX;
    if (tapX < width / 3) {
      goToPreviousStory();
    } else {
      goToNextStory();
    }
  };

  const handleFollowPress = () => {
    if (storyUser) {
      toggleFollow(storyUser.id);
    }
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

  const storyCount = currentUserStories.stories.length;

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
                <Text style={styles.timeAgo}>{formatTimeAgo(currentStory.created_at)}</Text>
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
              placeholder="Reply Story.."
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  backLink: {
    color: '#FFD400',
    fontSize: 14,
    marginTop: 12,
  },
  storyContent: {
    flex: 1,
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD400',
  },
  userMeta: {
    marginLeft: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  followBtn: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followingBtnText: {
    color: 'rgba(255,255,255,0.8)',
  },
  storyMentionContainer: {
    position: 'absolute',
    top: 200,
    left: 16,
  },
  storyMention: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 6,
  },
  replyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
