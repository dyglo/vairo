export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  seen_by: string[];
}

export interface UserStories {
  user_id: string;
  stories: Story[];
}

const now = new Date();
const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

export const mockStories: Story[] = [
  {
    id: 'story-1',
    user_id: 'user-3',
    media_url: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-2',
    user_id: 'user-3',
    media_url: 'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-3',
    user_id: 'user-1',
    media_url: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-4',
    user_id: 'user-1',
    media_url: 'https://images.pexels.com/photos/3784566/pexels-photo-3784566.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-5',
    user_id: 'user-2',
    media_url: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-6',
    user_id: 'user-4',
    media_url: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-7',
    user_id: 'user-5',
    media_url: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-8',
    user_id: 'user-5',
    media_url: 'https://images.pexels.com/photos/1933316/pexels-photo-1933316.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 5.5 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-9',
    user_id: 'user-7',
    media_url: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-10',
    user_id: 'user-9',
    media_url: 'https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-11',
    user_id: 'user-11',
    media_url: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
  {
    id: 'story-12',
    user_id: 'user-14',
    media_url: 'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    expires_at: oneDayFromNow.toISOString(),
    seen_by: [],
  },
];

export const getStoriesByUserId = (userId: string): Story[] => {
  return mockStories.filter(story => story.user_id === userId);
};

export const getUsersWithStories = (): string[] => {
  const userIds = new Set(mockStories.map(story => story.user_id));
  return Array.from(userIds);
};

export const getGroupedStories = (): UserStories[] => {
  const userIds = getUsersWithStories();
  return userIds.map(userId => ({
    user_id: userId,
    stories: getStoriesByUserId(userId),
  }));
};
