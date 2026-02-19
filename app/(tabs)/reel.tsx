import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Share2, Bookmark, Repeat2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

interface Reel {
  id: string;
  userId: string;
  userName: string;
  videoUrl: string;
  profilePicUrl: string;
  isVerified: boolean;
  likes: number;
  comments: number;
  caption: string;
}

const { width, height } = Dimensions.get('window');

export default function ReelScreen() {
  const insets = useSafeAreaInsets();
  const reelHeight = height;
  const [reels] = useState<Reel[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Max Jr',
      videoUrl: require('../../videos/advise.mp4'),
      profilePicUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=100&h=100&fit=crop',
      isVerified: true,
      likes: 1234,
      comments: 45,
      caption: 'City lights at night ✨',
    },
    {
      id: '2',
      userId: '2',
      userName: 'Max Jr',
      videoUrl: require('../../videos/song.mp4'),
      profilePicUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
      isVerified: true,
      likes: 2456,
      comments: 78,
      caption: 'Urban nightlife vibes 🌃',
    },
    {
      id: '3',
      userId: '3',
      userName: 'Max Jr',
      videoUrl: require('../../videos/trap.mp4'),
      profilePicUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=100&h=100&fit=crop',
      isVerified: true,
      likes: 3789,
      comments: 102,
      caption: 'Neon dreams in the city 💫',
    },
  ]);

  const renderReel = ({ item }: { item: Reel }) => (
    <View style={[styles.reelContainer, { height: reelHeight }]}>
      <Video
        source={item.videoUrl}
        style={styles.reelVideo}
        resizeMode="cover"
        isLooping
        shouldPlay
        useNativeControls={false}
      />

      <View style={styles.reelOverlay}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Heart size={28} color="#fff" fill="#fff" />
            <Text style={styles.actionLabel}>{item.likes > 999 ? '1.2K' : item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <MessageCircle size={28} color="#fff" />
            <Text style={styles.actionLabel}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Share2 size={28} color="#fff" />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Bookmark size={28} color="#fff" />
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Repeat2 size={28} color="#fff" />
            <Text style={styles.actionLabel}>Repost</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.followActionBtn]} activeOpacity={0.7}>
            <Text style={styles.followActionText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['transparent', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomBar}
        >
          <View style={styles.userFooter}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: item.profilePicUrl }}
                style={styles.profilePic}
              />
              <View style={styles.nameWithVerified}>
                <Text style={styles.userName}>{item.userName}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
        disableIntervalMomentum={false}
        removeClippedSubviews={true}
        snapToInterval={reelHeight}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelContainer: {
    width: width,
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  reelVideo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  reelOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 120,
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomBar: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    justifyContent: 'flex-end',
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#FFD400',
  },
  nameWithVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD400',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCheckmark: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: 'bold',
  },
  followActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFD400',
    borderRadius: 8,
    minWidth: 50,
  },
  followActionText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '600',
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFD400',
    borderRadius: 20,
  },
  followText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '600',
  },
});
