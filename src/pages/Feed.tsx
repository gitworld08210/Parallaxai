import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Menu, Sparkles, Users, PenSquare, Bell } from "lucide-react";
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

  const [chromeHidden, setChromeHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = (e: any) => {
      const y = e.target.scrollTop;
      if (y < 32) { setChromeHidden(false); lastY.current = y; return; }
      const dy = y - lastY.current;
      if (dy > 6) setChromeHidden(true);
      else if (dy < -6) setChromeHidden(false);
      lastY.current = y;
    };
    const main = document.querySelector('main');
    main?.addEventListener("scroll", onScroll, { passive: true });
    return () => main?.removeEventListener("scroll", onScroll);
  }, []);

  const displayName = profile?.display_name || profile?.username || "";

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      <Helmet>
        <title>Aurelix Feed — Discover creators, reels & live culture</title>
        <meta name="description" content="Your personalized Aurelix feed: creators, reels, live streams, and AI-native community moments in one place." />
        <meta property="og:title" content="Aurelix Feed — Discover creators, reels & live culture" />
        <meta property="og:description" content="Your personalized Aurelix feed: creators, reels, live streams, and AI-native community moments in one place." />
        <link rel="canonical" href="https://parallaxai.in/" />
        <meta property="og:url" content="https://parallaxai.in/" />
      </Helmet>
      <h1 className="sr-only">Aurelix Feed</h1>
      {/* Instagram-style translucent top chrome */}
      <div
        className={cn(
          "sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 transition-transform duration-300",
          chromeHidden ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <header className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SideMenu 
              trigger={
                <button className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-white/10">
                  {profile?.avatar_url ? (
                    <img src={getProfileAvatarUrl(profile.avatar_url)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <AuraAvatar gradient={gradientFor(profile?.username)} initials={initialsOf(displayName)} />
                  )}
                </button>
              }
            />
            <span className="font-serif italic text-3xl tracking-tighter">
              Parallax
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative">
              <Bell className="h-6 w-6" />
            </Link>
            <Link to="/messages">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </header>

        {/* X-style tabs with animated underline */}
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
                      className="absolute -bottom-px left-0 right-0 h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/60"
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

      <section className="pt-4 pb-24">
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
            <div key={p.id} className="min-h-[200px]">
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

      {/* Floating compose FAB */}
      <Link
        to="/compose"
        aria-label="Compose"
        className="absolute z-40 bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow hover:brightness-110 active:scale-95 transition-all"
      >
        <PenSquare className="h-6 w-6" strokeWidth={2.2} />
      </Link>

      <CommentSheet postId={commentPost} open={!!commentPost} onOpenChange={(b) => !b && setCommentPost(null)} />
    </div>
  );
};

export default Feed;
