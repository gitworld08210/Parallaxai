import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import {
  trackEngagement,
  updateInterestVector,
} from "@/services/interestEngine";

const SIGNAL_DELTA: Record<string, number> = {
  like: 1,
  save: 2,
  share: 3,
};

/**
 * Hook that exposes engagement tracking functions tied to the current user.
 */
export function useInterestTracking() {
  const { user } = useAuth();

  const trackLike = useCallback(
    async (postId: string, topicTags: string[]) => {
      if (!user) return;
      await trackEngagement(user.id, postId, "like", topicTags);
      for (const tag of topicTags) {
        await updateInterestVector(user.id, tag, SIGNAL_DELTA.like);
      }
    },
    [user]
  );

  const trackSave = useCallback(
    async (postId: string, topicTags: string[]) => {
      if (!user) return;
      await trackEngagement(user.id, postId, "save", topicTags);
      for (const tag of topicTags) {
        await updateInterestVector(user.id, tag, SIGNAL_DELTA.save);
      }
    },
    [user]
  );

  const trackShare = useCallback(
    async (postId: string, topicTags: string[]) => {
      if (!user) return;
      await trackEngagement(user.id, postId, "share", topicTags);
      for (const tag of topicTags) {
        await updateInterestVector(user.id, tag, SIGNAL_DELTA.share);
      }
    },
    [user]
  );

  const trackProfileVisit = useCallback(
    async (profileUserId: string) => {
      if (!user) return;
      await trackEngagement(user.id, profileUserId, "profile_visit", []);
    },
    [user]
  );

  return { trackLike, trackSave, trackShare, trackProfileVisit };
}
