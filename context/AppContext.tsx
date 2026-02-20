import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { storage } from '@/utils/storage';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  occupation: string;
  role: UserRole; // NEW: Role for RBAC
  followers_count: number;
  following_count: number;
  posts_count: number;
  likes_count: number;
  visibility_score: number;
  recent_impressions: number;
  created_at: string;
}

/**
 * Authentication state for logged-in user
 * Includes access token and role for protected operations
 */
export interface AuthState {
  userId: string;
  email: string;
  role: UserRole;
  accessToken: string;
  expiresIn: number; // Token expiration in seconds
}

export interface Post {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'video';
  caption: string;
  media_url?: string;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
  reach_score: number;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  seen_by: string[];
}

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
  createPost: (caption: string, type: 'text' | 'image' | 'video', mediaUrl?: string) => void;
  isLiked: (postId: string) => boolean;
  isFollowing: (userId: string) => boolean;
  isStorySeen: (storyId: string) => boolean;
  getReaction: (postId: string) => ReactionType | undefined;
  getComments: (postId: string) => Comment[];
  getUser: (userId: string) => User | undefined;
  getUserStories: (userId: string) => Story[];
  hasUnseenStories: (userId: string) => boolean;
  currentUser: User | null;
  // NEW: Authentication and role-based access
  auth: AuthState | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isModerator: () => boolean;
  canModerate: () => boolean; // admin | moderator
  canAdminister: () => boolean; // admin only
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories] = useState<Story[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [seenStories, setSeenStories] = useState<Set<string>>(new Set());
  const [postReactions, setPostReactions] = useState<Map<string, ReactionType>>(new Map());
  const [postComments, setPostComments] = useState<Map<string, Comment[]>>(new Map());

  // Restore mock authentication state on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Restore authentication state from storage
        const storedToken = await storage.getItem('accessToken');
        if (storedToken) {
          if (storedToken.startsWith('mock-')) {
            console.log('✓ Mock session restored from storage');

            setAuth({
              userId: 'dev-user-id',
              email: 'dev@example.com',
              role: 'admin',
              accessToken: storedToken,
              expiresIn: 3600,
            });

            setCurrentUser({
              id: 'dev-user-id',
              email: 'dev@example.com',
              name: 'Developer',
              username: 'developer',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              bio: 'I build cool things',
              location: 'San Francisco, CA',
              occupation: 'Software Engineer',
              role: 'admin',
              followers_count: 1250,
              following_count: 450,
              posts_count: 42,
              likes_count: 8500,
              visibility_score: 95,
              recent_impressions: 15400,
              created_at: new Date().toISOString(),
            });
          } else {
            // Clear stale tokens from previous real-auth attempts.
            await storage.removeItem('accessToken');
            setAuth(null);
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to restore mock auth session:', error);
        await storage.removeItem('accessToken');
        setAuth(null);
        setCurrentUser(null);
      }
    };

    initializeApp();
  }, []);

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

  const createPost = useCallback(
    (caption: string, type: 'text' | 'image' | 'video', mediaUrl?: string) => {
      const newPost: Post = {
        id: `post-${Date.now()}`,
        user_id: currentUser?.id || 'current-user',
        type,
        caption,
        media_url: mediaUrl,
        likes: 0,
        comments: 0,
        shares: 0,
        created_at: new Date().toISOString(),
        reach_score: 0,
      };

      setPosts(prev => [newPost, ...prev]);
    },
    [currentUser?.id]
  );

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
    return users.find(u => u.id === userId);
  }, [users]);

  const getUserStories = useCallback((userId: string): Story[] => {
    return stories.filter(s => s.user_id === userId);
  }, [stories]);

  const hasUnseenStories = useCallback((userId: string): boolean => {
    const userStories = stories.filter(s => s.user_id === userId);
    return userStories.some(s => !seenStories.has(s.id));
  }, [stories, seenStories]);

  // NEW: Authentication functions for role-based access
  const login = useCallback(async (email: string, password: string) => {
    try {
      // MOCK LOGIN: Accept any credentials for development as requested
      // In a real app, this would call authAPI.login(email, password)

      const mockUser = {
        userId: 'dev-user-id',
        email: email,
        role: 'admin' as UserRole,
        accessToken: 'mock-token-' + Date.now(),
        expiresIn: 3600,
      };

      // Store authentication state
      setAuth({
        userId: mockUser.userId,
        email: mockUser.email,
        role: mockUser.role,
        accessToken: mockUser.accessToken,
        expiresIn: mockUser.expiresIn,
      });

      // Store access token in storage for persistence
      await storage.setItem('accessToken', mockUser.accessToken);

      // Set currentUser
      setCurrentUser({
        id: mockUser.userId,
        email: mockUser.email,
        name: email.split('@')[0],
        username: email.split('@')[0],
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        bio: 'Just another user',
        location: 'Earth',
        occupation: 'Explorer',
        role: mockUser.role,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        likes_count: 0,
        visibility_score: 10,
        recent_impressions: 0,
        created_at: new Date().toISOString(),
      });

      console.log(`✓ Mock Login successful for ${mockUser.email} (${mockUser.role})`);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear auth state
      setAuth(null);
      setCurrentUser(null);
      await storage.removeItem('accessToken');

      console.log('✓ Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear state even if logout fails
      setAuth(null);
      setCurrentUser(null);
      await storage.removeItem('accessToken');
    }
  }, []);

  const isAdmin = useCallback(() => {
    return auth?.role === 'admin';
  }, [auth?.role]);

  const isModerator = useCallback(() => {
    return auth?.role === 'moderator';
  }, [auth?.role]);

  const canModerate = useCallback(() => {
    return auth?.role === 'admin' || auth?.role === 'moderator';
  }, [auth?.role]);

  const canAdminister = useCallback(() => {
    return auth?.role === 'admin';
  }, [auth?.role]);

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
    createPost,
    isLiked,
    isFollowing,
    isStorySeen,
    getReaction,
    getComments,
    getUser,
    getUserStories,
    hasUnseenStories,
    // NEW: Auth and role checking
    auth,
    login,
    logout,
    isAdmin,
    isModerator,
    canModerate,
    canAdminister,
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
