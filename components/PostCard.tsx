import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { MessageCircle, Share2, MoreVertical, Globe, X } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { formatNumber, formatTimeAgo } from '@/utils/feedAlgorithm';
import { useRouter } from 'expo-router';

type ReactionType = 'heart' | 'laugh' | 'love' | 'wow' | 'sad' | 'angry';

const REACTION_EMOJIS = [
  { type: 'heart', emoji: '❤️', color: '#FF4D4D' },
  { type: 'laugh', emoji: '😂', color: '#FFD400' },
  { type: 'love', emoji: '🥰', color: '#FF6B9D' },
  { type: 'wow', emoji: '😮', color: '#4ECDC4' },
  { type: 'sad', emoji: '😢', color: '#5B9CE6' },
  { type: 'angry', emoji: '😠', color: '#FF6B35' },
] as const;

interface PostCardProps {
  post: any;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { getUser, addComment, getComments } = useApp();
  const user = getUser(post.user_id);
  const [expanded, setExpanded] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  if (!user) return null;

  const caption = post.caption;
  const shouldTruncate = caption.length > 100 && !expanded;
  const displayCaption = shouldTruncate ? caption.slice(0, 100) + '...' : caption;
  const comments = getComments(post.id);

  const handleUserPress = () => {
    router.push(`/user/${user.id}`);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment(post.id, commentText.trim());
      setCommentText('');
      setShowCommentModal(false);
    }
  };

  const getReactionEmoji = (type: ReactionType) => {
    return REACTION_EMOJIS.find(r => r.type === type)?.emoji || '❤️';
  };

  const getReactionColor = (type: ReactionType) => {
    return REACTION_EMOJIS.find(r => r.type === type)?.color || '#FF4D4D';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleUserPress} activeOpacity={0.7}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
              <Text style={styles.dot}>•</Text>
              <Globe size={12} color="#888" />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn}>
          <MoreVertical size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.captionContainer}>
        <Text style={styles.captionName}>{user.name}</Text>
        <Text style={styles.caption}>
          {displayCaption}
          {shouldTruncate && (
            <Text style={styles.moreText} onPress={() => setExpanded(true)}> more</Text>
          )}
        </Text>
      </View>

      {post.media_url && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
          {post.type === 'video' && (
            <View style={styles.videoIndicator}>
              <Text style={styles.videoText}>VIDEO</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCommentModal(true)}>
          <MessageCircle size={22} color="#333" />
          {post.comments > 0 && (
            <Text style={styles.actionCount}>{formatNumber(post.comments)}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Share2 size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCommentModal}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.commentModal}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.commentsList}>
            {comments.length === 0 ? (
              <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
            ) : (
              comments.map((comment) => {
                const commentUser = getUser(comment.userId);
                return (
                  <View key={comment.id} style={styles.commentItem}>
                    <Image source={{ uri: commentUser?.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUser}>{commentUser?.name}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  userMeta: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  dot: {
    fontSize: 12,
    color: '#888',
    marginHorizontal: 4,
  },
  moreBtn: {
    padding: 4,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  captionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  caption: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  moreText: {
    color: '#0066CC',
    fontWeight: '500',
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#f0f0f0',
  },
  videoIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 16,
  },
  actionCount: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    fontWeight: '600',
  },
  commentModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noComments: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 40,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
