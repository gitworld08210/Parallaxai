import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Sparkles, Users, PenSquare, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { PostCard, FeedPost } from "@/components/social/PostCard";
import { CommentSheet } from "@/components/social/CommentSheet";
import { StoriesRail } from "@/components/social/StoriesRail";
import { SuggestedUsersRail } from "@/components/social/SuggestedUsersRail";
import { FeedSkeleton } from "@/components/social/FeedSkeleton";
import { EmptyState } from "@/components/empty/EmptyState";
import { SideMenu } from "@/components/layout/SideMenu";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { getInterestVector, scorePosts } from "@/services/interestEngine";
import { useInfiniteSupabase } from "@/hooks/useInfiniteSupabase";

import { useAuth } from "@/contexts/AuthProvider";
import { gradientFor, initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getProfileAvatarUrl } from "@/lib/cloudinary";
import { useTranslation } from "react-i18next";

const Feed = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [rankedPosts, setRankedPosts] = useState<FeedPost[]>([]);
  const [commentPost, setCommentPost] = useState<string | null>(null);

  // Supabase-based infinite scroll for posts
  const { data: rawPosts, loading, hasMore, loadMore, refresh } = useInfiniteSupabase<FeedPost>({
    table: "posts",
    select: "*",
    filters: [
      { column: "status", operator: "eq", value: "published" },
      { column: "is_reel", operator: "eq", value: false },
    ],
    orderBy: { column: "created_at", ascending: false },
    pageSize: 10,
    enabled: !!user,
  });

  // Apply interest ranking for "foryou" tab
  useEffect(() => {
    if (!user || rawPosts.length === 0) {
      setRankedPosts(rawPosts.map(p => ({ ...p, liked: false })));
      return;
    }
    if (tab === "foryou") {
      getInterestVector(user.id).then((interests) => {
        const scored = scorePosts(
          rawPosts.map(p => ({ ...p, liked: false })),
          interests
        );
        setRankedPosts(scored);
      }).catch(() => {
        setRankedPosts(rawPosts.map(p => ({ ...p, liked: false })));
      });
    } else {
      setRankedPosts(rawPosts.map(p => ({ ...p, liked: false })));
    }
  }, [rawPosts, tab, user?.id]);

  // Initial load + tab change
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user?.id]);

  const posts = rankedPosts;

  // IntersectionObserver sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  // Pull-to-refresh
  const touchStartY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchMove = useCallback(
    async (e: React.TouchEvent) => {
      if (refreshing) return;
      const main = document.querySelector("main");
      const scrollTop = main?.scrollTop ?? 0;
      if (scrollTop > 5) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 80) {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
      }
    },
    [refresh, refreshing]
  );

  const displayName = profile?.display_name || profile?.username || "";

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      <Helmet>
        <title>Parallax Feed</title>
        <meta name="description" content="Your personalized feed: creators, reels, and community moments." />
        <link rel="canonical" href="https://parallaxai.in/" />
      </Helmet>
      <h1 className="sr-only">Parallax Feed</h1>

      {/* X-style top header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <header className="h-14 px-4 flex items-center justify-between">
          <SideMenu 
            trigger={
              <button className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-border">
                {profile?.avatar_url ? (
                  <img src={getProfileAvatarUrl(profile.avatar_url)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <AuraAvatar gradient={gradientFor(profile?.username)} initials={initialsOf(displayName)} />
                )}
              </button>
            }
          />
          <span className="text-xl font-bold tracking-tight">
            Parallax
          </span>
          <Link to="/settings" className="p-2 -mr-2 rounded-full hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5 text-foreground" />
          </Link>
        </header>

        {/* X-style tabs with thin underline indicator */}
        <div role="tablist" className="grid grid-cols-2">
          {[
            { id: "foryou", label: t("feed.for_you") },
            { id: "following", label: t("feed.following") },
          ].map((item: any) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative h-12 text-[15px] font-semibold transition-colors hover:bg-secondary/40",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="relative inline-flex h-full items-center justify-center">
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="feed-tab-underline"
                      className="absolute -bottom-px left-0 right-0 h-[3px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      <StoriesRail />

      <section className="pb-24">
        {loading && posts.length === 0 && <FeedSkeleton count={2} />}
        {!loading && posts.length === 0 && (
          tab === "following" ? (
            <EmptyState
              icon={Users}
              title={t("feed.nothing_yet")}
              subtitle={t("feed.discover_people")}
              cta={{ label: t("feed.discover_people"), to: "/discover" }}
              size="lg"
            />
          ) : (
            <EmptyState
              icon={Sparkles}
              title={t("feed.nothing_yet")}
              subtitle={t("feed.be_first")}
              cta={{ label: t("feed.create_post"), to: "/compose" }}
              size="lg"
            />
          )
        )}
        <div className="divide-y divide-border flex flex-col">
          {posts.map((p, idx) => (
            <div key={p.id}>
              <PostCard post={p} onOpenComments={setCommentPost} />
              {idx === 2 && <SuggestedUsersRail />}
            </div>
          ))}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {loading && posts.length > 0 && <LoadingSpinner />}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">You're all caught up</p>
        )}
      </section>

      {/* Floating compose FAB - X-style blue circle */}
      <Link
        to="/compose"
        aria-label="Compose"
        className="fixed z-40 bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-elevated active:scale-95 transition-transform"
      >
        <PenSquare className="h-6 w-6" strokeWidth={2.2} />
      </Link>

      <CommentSheet postId={commentPost} open={!!commentPost} onOpenChange={(b) => !b && setCommentPost(null)} />
    </div>
  );
};

export default Feed;
