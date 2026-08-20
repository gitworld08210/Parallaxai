import { describe, it, expect } from "vitest";
import { scorePosts, InterestVector, ScoredPost } from "./interestEngine";

function makePost(overrides: Partial<ScoredPost> = {}): ScoredPost {
  return {
    id: "post-1",
    topic_tags: [],
    like_count: 5,
    comment_count: 2,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("scorePosts", () => {
  it("posts with matching topics rank higher", () => {
    const now = new Date().toISOString();
    const interests: InterestVector = { art: 10, music: 5 };

    const posts: ScoredPost[] = [
      makePost({ id: "no-match", topic_tags: ["sports"], created_at: now }),
      makePost({ id: "match", topic_tags: ["art", "music"], created_at: now }),
    ];

    const ranked = scorePosts(posts, interests);

    expect(ranked[0].id).toBe("match");
    expect(ranked[1].id).toBe("no-match");
  });

  it("more recent posts rank higher when topics are equal", () => {
    const interests: InterestVector = { art: 5 };
    const recentDate = new Date().toISOString();
    const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

    const posts: ScoredPost[] = [
      makePost({ id: "old", topic_tags: ["art"], created_at: oldDate, like_count: 5, comment_count: 2 }),
      makePost({ id: "recent", topic_tags: ["art"], created_at: recentDate, like_count: 5, comment_count: 2 }),
    ];

    const ranked = scorePosts(posts, interests);

    expect(ranked[0].id).toBe("recent");
    expect(ranked[1].id).toBe("old");
  });

  it("posts with higher engagement velocity rank higher", () => {
    const interests: InterestVector = { art: 5 };
    // Same time, same topics, different engagement
    const now = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

    const posts: ScoredPost[] = [
      makePost({ id: "low-engagement", topic_tags: ["art"], created_at: now, like_count: 1, comment_count: 0 }),
      makePost({ id: "high-engagement", topic_tags: ["art"], created_at: now, like_count: 50, comment_count: 20 }),
    ];

    const ranked = scorePosts(posts, interests);

    expect(ranked[0].id).toBe("high-engagement");
    expect(ranked[1].id).toBe("low-engagement");
  });

  it("posts without topic_tags still get a valid score", () => {
    const interests: InterestVector = { art: 5 };
    const now = new Date().toISOString();

    const posts: ScoredPost[] = [
      makePost({ id: "no-tags", topic_tags: undefined, created_at: now, like_count: 10, comment_count: 5 }),
      makePost({ id: "with-tags", topic_tags: ["art"], created_at: now, like_count: 10, comment_count: 5 }),
    ];

    const ranked = scorePosts(posts, interests);

    // Post without tags should still appear (not crash) but rank lower than a matching post
    expect(ranked).toHaveLength(2);
    expect(ranked[0].id).toBe("with-tags");
    expect(ranked[1].id).toBe("no-tags");

    // Verify no-tags post is still present and wasn't filtered out
    const noTagsPost = ranked.find((p) => p.id === "no-tags");
    expect(noTagsPost).toBeDefined();
  });
});
