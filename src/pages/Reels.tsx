import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Send, Plus, Volume2, VolumeX, Pause, Camera, Music2, Bookmark, MoreHorizontal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteSupabase } from "@/hooks/useInfiniteSupabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { useAuth } from "@/contexts/AuthProvider";
import { useAdInteraction } from "@/features/content-understanding/hooks/useAdIntelligence";
import { useAdRanking } from "@/features/content-understanding/hooks/useAdRanking";
import { WhyThisAd } from "@/features/content-understanding/components/WhyThisAd";
import { useContentContext } from "@/features/content-understanding/hooks/useContentContext";
import { CommentSheet } from "@/components/social/CommentSheet";
import { ShareToDM } from "@/components/social/ShareToDM";
import { TipSheet } from "@/components/social/TipSheet";
import { fmt } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Reel = {
  id: string;
  user_id: string;
  content: string;
  media_url: string;
  like_count: number;
  comment_count: number;
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
  liked?: boolean;
  bookmarked?: boolean;
};

const Reels = () => {
  const { user } = useAuth();
  const [muted, setMuted] = useState(true);
  const [commentPost, setCommentPost] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<string | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState<{ userId: string; username: string; reelId: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Cursor-based infinite scroll for reels using Supabase
  const { data: reelsData, loading: reelsLoading, hasMore, loadMore } = useInfiniteSupabase<Reel>({
    table: "posts",
    select: "*",
    filters: [
      { column: "is_reel", operator: "eq", value: true },
      { column: "status", operator: "eq", value: "published" },
    ],
    orderBy: { column: "created_at", ascending: false },
    pageSize: 10,
  });

  const [reels, setReels] = useState<Reel[]>([]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, [user?.id]);

  // Sync paginated data into local state
  useEffect(() => {
    setReels((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newReels = reelsData
        .filter((r) => !existingIds.has(r.id))
        .map((r) => ({ ...r, liked: false, bookmarked: false }));
      if (newReels.length === 0) return prev;
      return [...prev, ...newReels];
    });
  }, [reelsData]);

  // Load more reels when user is near the end
  const reelsSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = reelsSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !reelsLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, reelsLoading, loadMore]);

  useEffect(() => {
    if (!containerRef.current) return;
    const videos = Array.from(containerRef.current.querySelectorAll<HTMLVideoElement>("video[data-reel-id]"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        const id = v.dataset.reelId!;
        if (e.intersectionRatio > 0.7) {
          setActiveId(id);
          if (!pausedIds.has(id)) v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: [0, 0.7, 1] });
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [reels.length, pausedIds]);

  const toggleLike = async (r: Reel) => {
    if (!user) return toast.error("Sign in to like");
    const next = !r.liked;
    setReels((arr) => arr.map((x) => x.id === r.id ? { ...x, liked: next, like_count: x.like_count + (next ? 1 : -1) } : x));
  };

  const toggleBookmark = (r: Reel) => {
    setReels((arr) => arr.map((x) => x.id === r.id ? { ...x, bookmarked: !x.bookmarked } : x));
    toast.success(r.bookmarked ? "Removed from saved" : "Saved");
  };

  const togglePause = (r: Reel, videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    const next = new Set(pausedIds);
    if (next.has(r.id)) { next.delete(r.id); videoEl.play().catch(() => {}); }
    else { next.add(r.id); videoEl.pause(); }
    setPausedIds(next);
  };

  const share = (r: Reel) => {
    setSharePost(r.id);
  };

  return (
    <div className="bg-black text-white relative h-full w-full overflow-hidden">
      {/* Instagram Reels top header: "Reels" center, camera top-right */}
      <header className="absolute top-0 inset-x-0 z-30 pt-3 pb-4 px-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <div className="w-9" /> {/* spacer */}
        <span className="text-lg font-bold">Reels</span>
        <Link to="/compose/reel" className="p-2 -mr-2" aria-label="Camera">
          <Camera className="h-6 w-6" strokeWidth={1.8} />
        </Link>
      </header>

      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {reels.length === 0 && (
          <div className="h-full grid place-items-center text-center px-8">
            <div>
              <p className="font-bold text-2xl mb-2">No reels yet</p>
              <p className="text-sm text-white/60 mb-6">Be the first to drop one.</p>
              <Link to="/compose/reel" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                <Plus className="h-4 w-4" /> Create reel
              </Link>
            </div>
          </div>
        )}
        {reels.map((r) => (
          <div key={r.id} className="snap-start min-h-full w-full">
            <ReelItem
              key={r.id}
              r={r}
              muted={muted}
              isPaused={pausedIds.has(r.id)}
              isActive={activeId === r.id}
              onTogglePause={togglePause}
              onToggleMute={() => setMuted((m) => !m)}
              onToggleLike={toggleLike}
              onToggleBookmark={toggleBookmark}
              onOpenComments={(id) => setCommentPost(id)}
              onShare={share}
              onTip={(r) => { setTipTarget({ userId: r.user_id, username: r.profile?.username ?? "unknown", reelId: r.id }); setTipOpen(true); }}
            />
          </div>
        ))}
        {/* Sentinel for loading more reels */}
        <div ref={reelsSentinelRef} className="snap-start h-1 w-full" />
        {reelsLoading && (
          <div className="snap-start h-24 w-full grid place-items-center">
            <LoadingSpinner className="text-white" />
          </div>
        )}
      </div>

      <CommentSheet postId={commentPost} open={!!commentPost} onOpenChange={(b) => !b && setCommentPost(null)} />
      <ShareToDM postId={sharePost} open={!!sharePost} onOpenChange={(b) => !b && setSharePost(null)} />
      {tipTarget && (
        <TipSheet
          open={tipOpen}
          onOpenChange={setTipOpen}
          recipientId={tipTarget.userId}
          recipientName={tipTarget.username}
          postId={tipTarget.reelId}
        />
      )}
    </div>
  );
};

const ReelItem = ({
  r, muted, isPaused, isActive, onTogglePause, onToggleMute, onToggleLike, onToggleBookmark, onOpenComments, onShare, onTip,
}: {
  r: Reel;
  muted: boolean;
  isPaused: boolean;
  isActive: boolean;
  onTogglePause: (r: Reel, el: HTMLVideoElement | null) => void;
  onToggleMute: () => void;
  onToggleLike: (r: Reel) => void;
  onToggleBookmark: (r: Reel) => void;
  onOpenComments: (id: string) => void;
  onShare: (r: Reel) => void;
  onTip: (r: Reel) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTap = useRef(0);
  const watchTimer = useRef<number | null>(null);
  const lastActiveId = useRef<string | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [heartBurst, setHeartBurst] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const { mutate: recordInteraction } = useAdInteraction();
  const { data: context } = useContentContext(isActive ? r.id : undefined);
  const { data: ads = [] } = useAdRanking(isActive ? r.id : undefined);
  const ad = ads[0];

  useEffect(() => {
    if (isActive && r.id !== lastActiveId.current) {
      lastActiveId.current = r.id;
      if (watchTimer.current) window.clearInterval(watchTimer.current);
      
      const checkpoints = new Set([25, 50, 90]);
      watchTimer.current = window.setInterval(() => {
        if (!videoRef.current || isPaused) return;
        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        
        checkpoints.forEach(cp => {
          if (p >= cp) {
            recordInteraction({ 
              contentId: r.id, 
              topicIds: context ? [(context as any).primary_category_id, ...((context as any).secondary_category_ids ?? [])].filter(Boolean) as string[] : [], 
              signalType: `watch_${cp}` as any 
            });
            checkpoints.delete(cp);
          }
        });
        
        if (p >= 99) window.clearInterval(watchTimer.current!);
      }, 1000);
    }
    
    return () => {
      if (watchTimer.current) window.clearInterval(watchTimer.current);
    };
  }, [isActive, isPaused, r.id]);

  const onTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (!r.liked) onToggleLike(r);
      setHeartBurst((n) => n + 1);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current && Date.now() - lastTap.current >= 280) {
          onTogglePause(r, videoRef.current);
          lastTap.current = 0;
        }
      }, 290);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) { v.volume = 1; v.play().catch(() => {}); }
  }, [muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  return (
    <section className="relative h-full w-full snap-start grid place-items-center shrink-0">
      <video
        ref={videoRef}
        data-reel-id={r.id}
        src={r.media_url}
        loop
        playsInline
        muted={muted}
        onClick={onTap}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Scrims for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Double-tap heart burst */}
      <AnimatePresence>
        {heartBurst > 0 && (
          <motion.div
            key={heartBurst}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 grid place-items-center pointer-events-none"
            onAnimationComplete={() => setHeartBurst(0)}
          >
            <Heart className="h-32 w-32 fill-white text-white drop-shadow-2xl" strokeWidth={0} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="h-20 w-20 rounded-full bg-black/40 grid place-items-center">
            <Pause className="h-8 w-8 fill-white" />
          </div>
        </div>
      )}

      {/* Right action rail - Instagram Reels style: vertically stacked with counts */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        {/* Avatar + follow */}
        <Link to={r.profile ? `/u/${r.profile.username}` : "#"} className="relative pb-3">
          {r.profile?.avatar_url ? (
            <img src={r.profile.avatar_url} className="h-12 w-12 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary ring-2 ring-white grid place-items-center font-bold">
              {r.profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-rose-500 grid place-items-center ring-2 ring-black">
            <Plus className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
        </Link>

        <ActionButton
          icon={
            <Heart
              className={cn("h-7 w-7 transition-transform", r.liked ? "fill-rose-500 text-rose-500 scale-110" : "text-white")}
              strokeWidth={1.8}
            />
          }
          label={fmt(r.like_count)}
          onClick={() => onToggleLike(r)}
        />

        <ActionButton
          icon={<MessageCircle className="h-7 w-7 text-white" strokeWidth={1.8} />}
          label={fmt(r.comment_count)}
          onClick={() => onOpenComments(r.id)}
        />

        <ActionButton
          icon={<Send className="h-7 w-7 text-white" strokeWidth={1.8} />}
          label="Share"
          onClick={() => onShare(r)}
        />

        <ActionButton
          icon={<Bookmark className={cn("h-7 w-7", r.bookmarked ? "fill-white text-white" : "text-white")} strokeWidth={1.8} />}
          label="Save"
          onClick={() => onToggleBookmark(r)}
        />

        <ActionButton
          icon={<MoreHorizontal className="h-7 w-7 text-white" strokeWidth={1.8} />}
          label=""
          onClick={() => {}}
        />

        {/* Spinning album art disc */}
        <motion.div
          animate={{ rotate: isActive && !isPaused ? 360 : 0 }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          className="mt-1 h-9 w-9 rounded-full bg-gradient-to-br from-neutral-800 to-black ring-2 ring-white/30 grid place-items-center overflow-hidden"
        >
          {r.profile?.avatar_url ? (
            <img src={r.profile.avatar_url} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <Music2 className="h-4 w-4 text-white/80" />
          )}
        </motion.div>
      </div>

      {/* Bottom-left: username and caption - Instagram Reels style */}
      <div className="absolute left-4 right-20 bottom-6 z-20">
        <div className="flex items-center gap-2 mb-1.5">
          <Link to={r.profile ? `/u/${r.profile.username}` : "#"} className="font-bold text-[15px]">
            {r.profile?.username ?? "unknown"}
          </Link>
          {ad && <WhyThisAd explanation={ad.explanation} />}
        </div>
        {r.content && (
          <p
            onClick={() => setCaptionExpanded((v) => !v)}
            className={cn(
              "text-[14px] leading-snug text-white/95",
              !captionExpanded && "line-clamp-2"
            )}
          >
            {r.content}
          </p>
        )}
        {/* Audio track info */}
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-white/80">
          <Music2 className="h-3.5 w-3.5" />
          <div className="overflow-hidden max-w-[70%] whitespace-nowrap">
            <motion.span
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="inline-block pr-8"
            >
              Original sound - {r.profile?.username ?? "unknown"} · Original sound - {r.profile?.username ?? "unknown"} ·
            </motion.span>
          </div>
        </div>
      </div>

      {/* Mute toggle - top right below header */}
      <button
        onClick={onToggleMute}
        className="absolute top-14 right-4 h-8 w-8 rounded-full bg-black/40 grid place-items-center z-20"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Bottom progress bar */}
      <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-white/20 z-20">
        <div className="h-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
};

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
    <div className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{icon}</div>
    {label && <span className="text-[11px] font-semibold drop-shadow">{label}</span>}
  </button>
);

export default Reels;
