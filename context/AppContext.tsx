import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { mockUsers, currentUser, User } from '@/data/mockUsers';
import { mockPosts, Post } from '@/data/mockPosts';
import { mockStories, Story } from '@/data/mockStories';

export type ReactionType = 'heart' | 'laugh' | 'love' | 'wow' | 'sad' | 'angry';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

interface AppState {
  users: User[];
  posts: Post[];
  stories: Story[];
  currentUser: User;
  following: Set<string>;
  likedPosts: Set<string>;
  seenStories: Set<string>;
  postReactions: Map<string, ReactionType>;
  postComments: Map<string, Comment[]>;
}

interface AppContextType extends AppState {
  toggleLike: (postId: string, reactionType?: ReactionType) => void;
  toggleFollow: (userId: string) => void;
  markStorySeen: (storyId: string) => void;
  addComment: (postId: string, text: string) => void;
  isLiked: (postId: string) => boolean;
  isFollowing: (userId: string) => boolean;
  isStorySeen: (storyId: string) => boolean;
  getReaction: (postId: string) => ReactionType | undefined;
  getComments: (postId: string) => Comment[];
  getUser: (userId: string) => User | undefined;
  getUserStories: (userId: string) => Story[];
  hasUnseenStories: (userId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users] = useState<User[]>(mockUsers);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [stories] = useState<Story[]>(mockStories);
  const [following, setFollowing] = useState<Set<string>>(new Set(['user-1', 'user-2', 'user-5']));
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set(['post-1', 'post-4']));
  const [seenStories, setSeenStories] = useState<Set<string>>(new Set());
  const [postReactions, setPostReactions] = useState<Map<string, ReactionType>>(
    new Map([
      ['post-1', 'heart'],
      ['post-4', 'love'],
    ])
  );
  const [postComments, setPostComments] = useState<Map<string, Comment[]>>(new Map());

  const toggleLike = useCallback((postId: string, reactionType: ReactionType = 'heart') => {
    const wasLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPostReactions(prev => {
      const next = new Map(prev);
      if (wasLiked) {
        next.delete(postId);
      } else {
        next.set(postId, reactionType);
      }
      return next;
    });

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: wasLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  }, [likedPosts]);

  const addComment = useCallback((postId: string, text: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      userId: 'current-user',
      text,
      createdAt: new Date().toISOString(),
    };

    setPostComments(prev => {
      const next = new Map(prev);
      const existingComments = next.get(postId) || [];
      next.set(postId, [...existingComments, newComment]);
      return next;
    });

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1,
        };
      }
      return post;
    }));
  }, []);

  const toggleFollow = useCallback((userId: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const markStorySeen = useCallback((storyId: string) => {
    setSeenStories(prev => {
      const next = new Set(prev);
      next.add(storyId);
      return next;
    });
  }, []);

  const isLiked = useCallback((postId: string) => {
    return likedPosts.has(postId);
  }, [likedPosts]);

  const isFollowing = useCallback((userId: string) => {
    return following.has(userId);
  }, [following]);

  const isStorySeen = useCallback((storyId: string) => {
    return seenStories.has(storyId);
  }, [seenStories]);

  const getReaction = useCallback((postId: string): ReactionType | undefined => {
    return postReactions.get(postId);
  }, [postReactions]);

  const getComments = useCallback((postId: string): Comment[] => {
    return postComments.get(postId) || [];
  }, [postComments]);

  const getUser = useCallback((userId: string): User | undefined => {
    if (userId === 'current-user') return currentUser;
    return users.find(u => u.id === userId);
  }, [users]);

  const getUserStories = useCallback((userId: string): Story[] => {
    return stories.filter(s => s.user_id === userId);
  }, [stories]);

  const hasUnseenStories = useCallback((userId: string): boolean => {
    const userStories = stories.filter(s => s.user_id === userId);
    return userStories.some(s => !seenStories.has(s.id));
  }, [stories, seenStories]);

  const value: AppContextType = {
    users,
    posts,
    stories,
    currentUser,
    following,
    likedPosts,
    seenStories,
    postReactions,
    postComments,
    toggleLike,
    toggleFollow,
    markStorySeen,
    addComment,
    isLiked,
    isFollowing,
    isStorySeen,
    getReaction,
    getComments,
    getUser,
    getUserStories,
    hasUnseenStories,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
