import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MoreHorizontal, Settings, X as XIcon } from "lucide-react";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { VerificationBadge } from "@/components/vibe/VerificationBadge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useInfiniteSupabase } from "@/hooks/useInfiniteSupabase";

import { useAuth } from "@/contexts/AuthProvider";
import { fmt, gradientFor, initialsOf } from "@/lib/format";
import { toast } from "sonner";
import { checkRateLimit, followLimiter } from "@/lib/rateLimit";
import { cn } from "@/lib/utils";
import { getProfileAvatarUrl } from "@/lib/cloudinary";

type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  verification_kind?: string | null;
  followers_count: number;
  is_founder?: boolean | null;
};

type TrendingPost = {
  id: string;
  media_url: string | null;
  media_type: string | null;
  like_count: number;
  content: string;
};

/** X Explore tabs. */
const TABS = ["For you", "Trending", "News", "Sports", "Entertainment"] as const;

const Discover = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [trending, setTrending] = useState<TrendingPost[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>("For you");

  // Cursor-based pagination for profiles using Supabase
  const {
    data: paginatedProfiles,
    loading: profilesLoading,
    hasMore: profilesHasMore,
    loadMore: loadMoreProfiles,
  } = useInfiniteSupabase<Profile>({
    table: "profiles",
    select: "*",
    orderBy: { column: "followers_count", ascending: false },
    pageSize: 20,
  });

  const allProfiles = useMemo(
    () => paginatedProfiles.filter((p) => p.user_id !== user?.id),
    [paginatedProfiles, user?.id]
  );

  // Initial load of profiles + trending posts
  const initialLoadDoneRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    initialLoadDoneRef.current = false;
    setLoading(true);
    Promise.all([
      loadMoreProfiles(),
      supabase
        .from('posts')
        .select('*')
        .eq('is_reel', false)
        .order('like_count', { ascending: false })
        .limit(6),
      Promise.resolve({ data: [] }),
    ]).then(([_, tRes, fRes]) => {
      if (cancelled) return;
      initialLoadDoneRef.current = true;
      setTrending(((tRes.data || []) as unknown as TrendingPost[]));
      setFollowing(new Set(((fRes.data ?? []) as any[]).map((f) => f.following_id)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // IntersectionObserver sentinel for profiles pagination
  const profilesSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = profilesSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && profilesHasMore && !profilesLoading && initialLoadDoneRef.current) {
          loadMoreProfiles();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [profilesHasMore, profilesLoading, loadMoreProfiles]);

  const toggleFollow = async (target: string) => {
    if (!user) return toast.error("Sign in to follow");
    if (!checkRateLimit(followLimiter)) return;
    const isF = following.has(target);
    const next = new Set(following);
    if (isF) {
      next.delete(target); setFollowing(next);
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', target);
    } else {
      next.add(target); setFollowing(next);
      try {
        const { error } = await supabase.from('follows').insert({
          id: `${user.id}_${target}`,
          follower_id: user.id,
          following_id: target,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      } catch (e) {
        next.delete(target); setFollowing(new Set(next)); toast.error("Follow failed");
      }
    }
  };

  const term = q.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!term) return [];
    return allProfiles.filter(
      (p) =>
        p.username.toLowerCase().includes(term) ||
        (p.display_name || "").toLowerCase().includes(term)
    );
  }, [allProfiles, term]);

  /** Trending topics rendered in X's "Trending in <place> · N posts" shape. */
  const trendingTopics = [
    { category: "Trending in Technology", topic: "#cyberpunk", posts: 12_400 },
    { category: "Trending", topic: "#future", posts: 8_700 },
    { category: "Technology · Trending", topic: "#aiart", posts: 6_200 },
    { category: "Trending in India", topic: "#aurelix", posts: 15_100 },
    { category: "Entertainment · Trending", topic: "#reels", posts: 4_800 },
  ];

  return (
    <div className="pb-24">
      {/* X Explore header - search bar pinned at the top, no blur */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <header className="h-[53px] px-4 flex items-center gap-3">
          <div className="flex-1 h-9 rounded-full bg-secondary flex items-center gap-3 px-4 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary transition-colors">
            <Search className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" className="shrink-0">
                <span className="grid place-items-center h-[18px] w-[18px] rounded-full bg-primary">
                  <XIcon className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </span>
              </button>
            )}
          </div>
          <Link to="/settings" aria-label="Settings" className="shrink-0 p-1.5 -mr-1.5 rounded-full hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        {/* Explore category tabs */}
        {!term && (
          <div role="tablist" className="flex overflow-x-auto no-scrollbar">
            {TABS.map((tItem) => {
              const active = tab === tItem;
              return (
                <button
                  key={tItem}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tItem)}
                  className={cn(
                    "relative shrink-0 px-4 h-[53px] text-[15px] font-semibold transition-colors hover:bg-secondary/40",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="relative inline-flex h-full items-center">
                    {tItem}
                    {active && (
                      <span className="absolute -bottom-px left-0 right-0 h-1 rounded-full bg-primary" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {term ? (
        /* Search results replace the whole surface while typing */
        <div className="divide-y divide-border">
          {searchResults.length === 0 && (
            <p className="text-[15px] text-muted-foreground text-center py-10">
              No results for "{q.trim()}"
            </p>
          )}
          {searchResults.map((p) => (
            <CreatorRow key={p.user_id} p={p} following={following.has(p.user_id)} onToggle={() => toggleFollow(p.user_id)} />
          ))}
        </div>
      ) : (
        <>
          {/* Trends for you - X's numbered trending list */}
          <section>
            <h2 className="px-4 pt-3 pb-1 text-[20px] font-extrabold tracking-tight">Trends for you</h2>
            <div className="divide-y divide-border">
              {trendingTopics.map((t, i) => (
                <Link
                  key={t.topic}
                  to={`/tag/${t.topic.replace(/^#/, "")}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-muted-foreground leading-4">
                      {i + 1} · {t.category}
                    </p>
                    <p className="text-[15px] font-bold leading-5 mt-0.5 truncate">{t.topic}</p>
                    <p className="text-[13px] text-muted-foreground leading-4 mt-0.5">
                      {fmt(t.posts)} posts
                    </p>
                  </div>
                  <span
                    className="shrink-0 -mr-2 p-2 rounded-full text-muted-foreground"
                    aria-hidden
                  >
                    <MoreHorizontal className="h-[18px] w-[18px]" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* What's happening - trending media as X's compact preview rows */}
          {(loading || trending.length > 0) && (
            <section className="border-t border-border">
              <h2 className="px-4 pt-3 pb-1 text-[20px] font-extrabold tracking-tight">What's happening</h2>
              <div className="divide-y divide-border">
                {loading && trending.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
                      <div className="h-4 w-48 rounded bg-secondary animate-pulse" />
                    </div>
                    <div className="h-[70px] w-[70px] rounded-xl bg-secondary animate-pulse" />
                  </div>
                ))}
                {trending.map((t) => (
                  <Link
                    key={t.id}
                    to={`/p/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-muted-foreground leading-4">Trending</p>
                      <p className="text-[15px] font-bold leading-5 mt-0.5 line-clamp-2">
                        {t.content || "Untitled post"}
                      </p>
                      <p className="text-[13px] text-muted-foreground leading-4 mt-0.5">
                        {fmt(t.like_count)} likes
                      </p>
                    </div>
                    {t.media_url && (
                      <div className="shrink-0 h-[70px] w-[70px] rounded-xl overflow-hidden bg-secondary">
                        {t.media_type === "video" ? (
                          <video src={t.media_url} muted className="h-full w-full object-cover" />
                        ) : (
                          <img src={t.media_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Who to follow */}
          <section className="border-t border-border">
            <h2 className="px-4 pt-3 pb-1 text-[20px] font-extrabold tracking-tight">Who to follow</h2>
            <div className="divide-y divide-border">
              {allProfiles.map((p) => (
                <CreatorRow key={p.user_id} p={p} following={following.has(p.user_id)} onToggle={() => toggleFollow(p.user_id)} />
              ))}
            </div>
            <div ref={profilesSentinelRef} className="h-1" />
            {profilesLoading && <LoadingSpinner />}
            {!profilesHasMore && allProfiles.length > 0 && (
              <p className="text-center text-[15px] text-muted-foreground py-6">No more people to show</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

/** X "who to follow" row: avatar, name/handle stack, pill Follow button. */
const CreatorRow = ({
  p, following, onToggle,
}: { p: Profile; following: boolean; onToggle: () => void }) => (
  <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30">
    <Link to={`/u/${p.username}`} className="shrink-0">
      {p.avatar_url ? (
        <img src={getProfileAvatarUrl(p.avatar_url)} className="h-10 w-10 rounded-full object-cover" alt="" />
      ) : (
        <AuraAvatar gradient={gradientFor(p.username)} size="sm" initials={initialsOf(p.display_name || p.username)} />
      )}
    </Link>
    <Link to={`/u/${p.username}`} className="flex-1 min-w-0">
      <span className="flex items-center gap-1">
        <span className="text-[15px] font-bold truncate">{p.display_name || p.username}</span>
        {p.verification_kind ? <VerificationBadge kind={p.verification_kind as any} /> : p.verified && <VerificationBadge kind="verified" />}
      </span>
      <span className="block text-[15px] text-muted-foreground truncate leading-5">@{p.username}</span>
      {p.bio && <span className="block text-[15px] leading-5 mt-0.5 line-clamp-2">{p.bio}</span>}
    </Link>
    <button
      onClick={onToggle}
      className={cn(
        "shrink-0 h-8 px-4 rounded-full text-[14px] font-bold transition-colors",
        following
          ? "bg-transparent text-foreground border border-border hover:bg-secondary"
          : "bg-foreground text-background hover:opacity-90"
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  </div>
);

export default Discover;
