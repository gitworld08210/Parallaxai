import { supabase } from "@/integrations/supabase/client";

export type SignalType = "watch_time" | "like" | "save" | "share" | "profile_visit";

export interface EngagementEvent {
  user_id: string;
  post_id: string;
  signal_type: SignalType;
  topic_tags: string[];
  timestamp: string;
}

export interface InterestVector {
  [topic: string]: number;
}

export interface ScoredPost {
  id: string;
  topic_tags?: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  [key: string]: any;
}

/**
 * Writes an engagement event to Supabase `engagement_events` table.
 */
export async function trackEngagement(
  userId: string,
  postId: string,
  signal: SignalType,
  topicTags: string[]
): Promise<void> {
  await supabase.from("engagement_events" as any).insert({
    user_id: userId,
    post_id: postId,
    signal_type: signal,
    topic_tags: topicTags,
    timestamp: new Date().toISOString(),
  } as any);
}

/**
 * Updates `user_interests` for a user, incrementing a topic score by delta.
 */
export async function updateInterestVector(
  userId: string,
  topic: string,
  delta: number
): Promise<void> {
  // Fetch current value
  const { data: existing } = await supabase
    .from("user_interests")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const current = (existing as any) || {};
  const scores = current.scores || {};
  scores[topic] = (scores[topic] || 0) + delta;

  await supabase.from("user_interests").upsert({
    user_id: userId,
    scores,
  } as any);
}

/**
 * Reads user interests and returns the topic scores map.
 */
export async function getInterestVector(userId: string): Promise<InterestVector> {
  const { data } = await supabase
    .from("user_interests")
    .select("scores")
    .eq("user_id", userId)
    .maybeSingle();

  if (data && (data as any).scores) {
    return (data as any).scores as InterestVector;
  }
  return {};
}

/**
 * Pure function: scores and sorts posts by predicted engagement.
 *
 * Score = content_topic_match * recency_factor * engagement_velocity
 *
 * - content_topic_match = sum of matching topic scores, normalized
 * - recency_factor = 1 / (1 + hours_since_post / 24)
 * - engagement_velocity = (like_count + comment_count * 2) / max(1, hours_since_post)
 */
export function scorePosts<T extends ScoredPost>(
  posts: T[],
  userInterests: InterestVector
): T[] {
  const now = Date.now();

  const scored = posts.map((post) => {
    const topicTags = post.topic_tags || [];
    const hoursSincePost = Math.max(
      0,
      (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
    );

    // content_topic_match: sum of matching topic scores, normalized
    let topicMatchRaw = 0;
    for (const tag of topicTags) {
      if (userInterests[tag]) {
        topicMatchRaw += userInterests[tag];
      }
    }
    // Normalize: ensure a minimum base score so posts without matching topics still appear
    const contentTopicMatch = topicMatchRaw > 0 ? topicMatchRaw : 0.1;

    // recency_factor: 1 / (1 + hours_since_post / 24)
    const recencyFactor = 1 / (1 + hoursSincePost / 24);

    // engagement_velocity: (like_count + comment_count * 2) / max(1, hours_since_post)
    // Floor of 1 ensures brand-new posts with no engagement still get ranked by topic match and recency
    const engagementVelocity =
      Math.max(1, post.like_count + post.comment_count * 2) / Math.max(1, hoursSincePost);

    const score = contentTopicMatch * recencyFactor * engagementVelocity;

    return { post, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.post);
}
