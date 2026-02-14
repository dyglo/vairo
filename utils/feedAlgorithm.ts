import { Post } from '@/data/mockPosts';
import { User, mockUsers, getUserById } from '@/data/mockUsers';

interface RankedPost extends Post {
  ranking_score: number;
}

/**
 * VAIRO ANTI-BIAS FEED ALGORITHM
 *
 * Core Philosophy: "Everyone deserves to be heard"
 *
 * This algorithm reverses traditional social media bias where high-follower
 * accounts dominate visibility. Instead, it:
 *
 * 1. Boosts under-exposed users (low visibility_score, few followers)
 * 2. Penalizes dominant accounts (high recent_impressions)
 * 3. Ensures fair content rotation
 * 4. Still considers engagement quality (diverse interactions)
 *
 * The result: A more democratic feed where new voices get heard.
 */

const WEIGHTS = {
  UNDEREXPOSURE_BOOST: 0.35,
  FOLLOWER_BALANCE: 0.25,
  RECENCY: 0.20,
  ENGAGEMENT_QUALITY: 0.15,
  CONTENT_DIVERSITY: 0.05,
};

function calculateUnderexposureBoost(user: User): number {
  const maxVisibility = 100;
  const inversedVisibility = maxVisibility - user.visibility_score;
  const normalizedBoost = inversedVisibility / maxVisibility;
  return normalizedBoost;
}

function calculateFollowerBalance(user: User): number {
  const maxFollowers = 250000;
  const followerPenalty = Math.min(user.followers_count / maxFollowers, 1);
  return 1 - followerPenalty;
}

function calculateImpressionDecay(user: User): number {
  const maxImpressions = 100000;
  const impressionPenalty = Math.min(user.recent_impressions / maxImpressions, 1);
  return 1 - (impressionPenalty * 0.8);
}

function calculateRecencyScore(post: Post): number {
  const now = new Date();
  const postDate = new Date(post.created_at);
  const hoursAgo = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.exp(-hoursAgo / 48);
  return decayFactor;
}

function calculateEngagementQuality(post: Post, user: User): number {
  const totalEngagement = post.likes + post.comments * 2 + post.shares * 3;
  const engagementPerFollower = user.followers_count > 0
    ? totalEngagement / user.followers_count
    : totalEngagement;
  const normalizedEngagement = Math.min(engagementPerFollower / 10, 1);
  return normalizedEngagement;
}

function calculateContentDiversity(post: Post, recentTypes: string[]): number {
  const typeCount = recentTypes.filter(t => t === post.type).length;
  const diversityScore = 1 - (typeCount / Math.max(recentTypes.length, 1));
  return diversityScore;
}

export function rankFeedPosts(posts: Post[]): Post[] {
  const recentTypes: string[] = [];

  const rankedPosts: RankedPost[] = posts.map(post => {
    const user = getUserById(post.user_id);

    if (!user) {
      return { ...post, ranking_score: 0 };
    }

    const underexposureBoost = calculateUnderexposureBoost(user);
    const followerBalance = calculateFollowerBalance(user);
    const impressionDecay = calculateImpressionDecay(user);
    const recencyScore = calculateRecencyScore(post);
    const engagementQuality = calculateEngagementQuality(post, user);
    const contentDiversity = calculateContentDiversity(post, recentTypes);

    recentTypes.push(post.type);
    if (recentTypes.length > 5) recentTypes.shift();

    const ranking_score =
      (underexposureBoost * WEIGHTS.UNDEREXPOSURE_BOOST) +
      (followerBalance * WEIGHTS.FOLLOWER_BALANCE) +
      (recencyScore * WEIGHTS.RECENCY) +
      (engagementQuality * WEIGHTS.ENGAGEMENT_QUALITY) +
      (contentDiversity * WEIGHTS.CONTENT_DIVERSITY) +
      (impressionDecay * 0.1);

    return { ...post, ranking_score };
  });

  rankedPosts.sort((a, b) => b.ranking_score - a.ranking_score);

  return interleavePrioritySlots(rankedPosts);
}

function interleavePrioritySlots(posts: RankedPost[]): Post[] {
  const result: Post[] = [];
  const underexposedPosts = posts.filter(p => {
    const user = getUserById(p.user_id);
    return user && user.visibility_score < 30;
  });
  const regularPosts = posts.filter(p => {
    const user = getUserById(p.user_id);
    return user && user.visibility_score >= 30;
  });

  let underIdx = 0;
  let regularIdx = 0;

  for (let i = 0; i < posts.length; i++) {
    if (i % 4 === 2 && underIdx < underexposedPosts.length) {
      result.push(underexposedPosts[underIdx]);
      underIdx++;
    } else if (regularIdx < regularPosts.length) {
      result.push(regularPosts[regularIdx]);
      regularIdx++;
    } else if (underIdx < underexposedPosts.length) {
      result.push(underexposedPosts[underIdx]);
      underIdx++;
    }
  }

  return result;
}

export function rankStoryUsers(userIds: string[]): string[] {
  return [...userIds].sort((a, b) => {
    const userA = getUserById(a);
    const userB = getUserById(b);

    if (!userA || !userB) return 0;

    const scoreA = (100 - userA.visibility_score) + (1 - userA.recent_impressions / 100000) * 50;
    const scoreB = (100 - userB.visibility_score) + (1 - userB.recent_impressions / 100000) * 50;

    return scoreB - scoreA;
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
