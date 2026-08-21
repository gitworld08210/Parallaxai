import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, BarChart3,
  FolderPlus, Trash2, Flag, Sparkles, ShieldCheck,
} from "lucide-react";
import { TipSheet } from "@/components/social/TipSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { VerificationBadge } from "@/components/vibe/VerificationBadge";
import { fmt, gradientFor, initialsOf, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { checkRateLimit, likeLimiter } from "@/lib/rateLimit";
import { ShareToDM } from "@/components/social/ShareToDM";
import { SaveToCollectionSheet } from "@/components/social/SaveToCollectionSheet";
import { ReportSheet } from "@/components/social/ReportSheet";
import { FounderBadge } from "@/components/founders/FounderBadge";
import { GenesisMark } from "@/components/founders/GenesisMark";
import { DoubleTapHeart } from "@/components/social/DoubleTapHeart";
import { cn } from "@/lib/utils";
import { getFeedImageUrl, getProfileAvatarUrl } from "@/lib/cloudinary";

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  like_count: number;
  comment_count: number;
  view_count?: number | null;
  created_at: string;
  has_certificate?: boolean | null;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
    verification_kind?: string | null;
    is_founder?: boolean | null;
    join_era?: string | null;
  } | null;
  liked: boolean;
  collaborators?: { username: string; display_name: string; avatar_url: string | null }[];
};

const viewedThisSession = new Set<string>();

const linkify = (text: string) =>
  text.split(/(\s+)/).map((tok, i) => {
    if (tok.startsWith("#") && tok.length > 1) {
      const tag = tok.slice(1).replace(/[^\w]/g, "");
      if (tag) return <Link key={i} to={`/tag/${tag}`} className="text-primary hover:underline">{tok}</Link>;
    }
    if (tok.startsWith("@") && tok.length > 1) {
      const u = tok.slice(1).replace(/[^\w.]/g, "");
      if (u) return <Link key={i} to={`/u/${u}`} className="text-primary hover:underline">{tok}</Link>;
    }
    return <span key={i}>{tok}</span>;
  });

export const PostCard = ({ post, onOpenComments }: { post: FeedPost; onOpenComments: (id: string) => void }) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.like_count);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [views, setViews] = useState(post.view_count ?? 0);
  const [burst, setBurst] = useState(0);
  const [collabs, setCollabs] = useState<NonNullable<FeedPost["collaborators"]>>(post.collaborators ?? []);
  const lastTap = useRef(0);
  const articleRef = useRef<HTMLElement>(null);
  const isOwner = user?.id === post.user_id;
  const isFounder = !!post.profile?.is_founder;
  const tier: "genesis" | "founder" = post.profile?.join_era === "genesis" ? "genesis" : "founder";

  useEffect(() => { setLiked(post.liked); setLikes(post.like_count); }, [post.liked, post.like_count]);

  useEffect(() => { setViews(post.view_count ?? 0); }, [post.id, post.view_count]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const saveId = `${user.id}_${post.id}`;
        const { data } = await supabase
          .from('saves')
          .select('id')
          .eq('id', saveId)
          .maybeSingle();
        setSaved(!!data);
      } catch (err) {
        console.error("Error checking save:", err);
      }
    })();
  }, [user?.id, post.id]);

  useEffect(() => {
    setCollabs(post.collaborators ?? []);
  }, [post.id, post.collaborators]);

  useEffect(() => {
    if (!user || !articleRef.current || viewedThisSession.has(post.id)) return;
    const el = articleRef.current;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= 0.6 && !viewedThisSession.has(post.id)) {
          viewedThisSession.add(post.id);
          try {
            const currentViewCount = post.view_count ?? 0;
            setViews(currentViewCount + 1);
            supabase
              .from('posts')
              .update({ view_count: currentViewCount + 1 })
              .eq('id', post.id)
              .then(() => {});
          } catch(e) {}
          obs.disconnect();
        }
      }
    }, { threshold: [0.6] });
    obs.observe(el);
    return () => obs.disconnect();
  }, [user?.id, post.id]);

  const toggleLike = async () => {
    if (!user) return toast.error("Sign in to like");
    if (!checkRateLimit(likeLimiter)) return;
    const next = !liked;
    setLiked(next); setLikes((c) => c + (next ? 1 : -1));
    try {
      const likeId = `${user.id}_${post.id}`;

      if (next) {
        await supabase.from('likes').insert({
          id: likeId,
          user_id: user.id,
          post_id: post.id,
          created_at: new Date().toISOString(),
        });
        await supabase.from('posts').update({ like_count: likes + 1 }).eq('id', post.id);
      } else {
        await supabase.from('likes').delete().eq('id', likeId);
        await supabase.from('posts').update({ like_count: likes - 1 }).eq('id', post.id);
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      setLiked(!next); setLikes((c) => c + (next ? -1 : 1));
      toast.error("Could not update like");
    }
  };

  const toggleSave = async () => {
    if (!user) return toast.error("Sign in to save");
    const next = !saved;
    setSaved(next);
    try {
      const saveId = `${user.id}_${post.id}`;
      if (next) {
        await supabase.from('saves').insert({
          id: saveId,
          user_id: user.id,
          post_id: post.id,
          created_at: new Date().toISOString(),
        });
        toast.success("Saved");
      } else {
        await supabase.from('saves').delete().eq('id', saveId);
      }
    } catch (error: any) {
      console.error("Error toggling save:", error);
      setSaved(!next);
      toast.error("Could not update save");
    }
  };

  const onMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) toggleLike();
      setBurst((n) => n + 1);
    }
    lastTap.current = now;
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      toast.success("Deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handle = post.profile?.username ?? "unknown";
  const name = post.profile?.display_name || handle;
  const caption = post.content || "";
  const longCaption = caption.length > 240;
  const shortCaption = longCaption && !expanded ? caption.slice(0, 240) : caption;

  return (
    <article ref={articleRef} className="px-4 pt-3 pb-3 transition-colors hover:bg-secondary/20">
      {/* X-style tweet layout: avatar left, content right, no card wrapper */}
      <div className="flex gap-3">
        {/* Avatar column */}
        <Link to={`/u/${handle}`} className="shrink-0">
          {post.profile?.avatar_url ? (
            <img
              src={getProfileAvatarUrl(post.profile.avatar_url)}
              alt={name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <AuraAvatar gradient={gradientFor(handle)} size="sm" initials={initialsOf(name)} />
          )}
        </Link>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Name row - X style: Name + badge + @handle + dot + time all in one line */}
          <header className="flex items-center gap-1 text-[15px] leading-5">
            <Link to={`/u/${handle}`} className="font-bold truncate hover:underline">{name}</Link>
            {isFounder && <FounderBadge tier={tier} size={12} />}
            {post.profile?.verification_kind
              ? <VerificationBadge kind={post.profile.verification_kind as any} />
              : post.profile?.verified && <VerificationBadge kind="verified" />}
            {post.has_certificate && (
              <Link to={`/certificate/${post.id}`} aria-label="Ownership certificate" className="inline-flex">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              </Link>
            )}
            <span className="text-muted-foreground truncate">@{handle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground shrink-0" title={new Date(post.created_at).toLocaleString()}>
              {timeAgo(post.created_at)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-auto -mr-2 p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => setCollectionOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" /> Save to collection
                </DropdownMenuItem>
                {post.has_certificate && (
                  <DropdownMenuItem asChild>
                    <Link to={`/certificate/${post.id}`}>
                      <ShieldCheck className="h-4 w-4 mr-2" /> View certificate
                    </Link>
                  </DropdownMenuItem>
                )}
                {isOwner && !post.has_certificate && post.media_url && (
                  <DropdownMenuItem onSelect={async () => {
                    toast.loading("Generating certificate...", { id: "cert" });
                    toast.error("Certificate generation coming soon");
                  }}>
                    <ShieldCheck className="h-4 w-4 mr-2" /> Generate certificate
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem asChild>
                    <Link to={`/p/${post.id}/insights`}>
                      <BarChart3 className="h-4 w-4 mr-2" /> View insights
                    </Link>
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <DropdownMenuItem onSelect={() => setReportOpen(true)} className="text-destructive focus:text-destructive">
                    <Flag className="h-4 w-4 mr-2" /> Report
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem onSelect={remove} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {collabs.length > 0 && (
            <p className="text-[13px] text-muted-foreground truncate mt-0.5">
              with {collabs.slice(0, 2).map((c, i) => (
                <span key={c.username}>
                  {i > 0 && " & "}
                  <Link to={`/u/${c.username}`} className="text-foreground/80 font-medium hover:underline">@{c.username}</Link>
                </span>
              ))}
              {collabs.length > 2 && ` +${collabs.length - 2}`}
            </p>
          )}

          {/* Caption */}
          {caption && (
            <p className="mt-0.5 text-[15px] leading-5 whitespace-pre-wrap break-words">
              {linkify(shortCaption)}
              {longCaption && !expanded && (
                <>
                  <span className="text-muted-foreground">... </span>
                  <button onClick={() => setExpanded(true)} className="text-primary font-medium hover:underline">
                    Show more
                  </button>
                </>
              )}
            </p>
          )}

          {/* Media - rounded corners with thin border */}
          {post.media_url && (
            <div
              onClick={onMediaTap}
              className="relative mt-3 rounded-2xl overflow-hidden border border-border select-none"
            >
              {post.media_type === "video" ? (
                <video src={post.media_url} controls playsInline className="w-full max-h-[560px] object-cover" />
              ) : (
                <img src={getFeedImageUrl(post.media_url)} alt="" className="w-full max-h-[560px] object-cover" draggable={false} loading="lazy" />
              )}
              <DoubleTapHeart trigger={burst} />
            </div>
          )}

          {/* X action bar - exact order: reply, repost, like, views, bookmark, share */}
          <div className="mt-3 -ml-2 flex items-center justify-between max-w-[425px] text-muted-foreground">
            <ActionBtn
              label="Reply"
              onClick={() => onOpenComments(post.id)}
              icon={<MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />}
              count={post.comment_count}
              hoverClass="group-hover:text-primary group-hover:bg-primary/10"
              textClass="group-hover:text-primary"
            />
            <ActionBtn
              label="Repost"
              onClick={() => setShareOpen(true)}
              icon={<Repeat2 className="h-[18px] w-[18px]" strokeWidth={1.8} />}
              hoverClass="group-hover:text-repost group-hover:bg-repost/10"
              textClass="group-hover:text-repost"
            />
            <ActionBtn
              label={liked ? "Unlike" : "Like"}
              onClick={toggleLike}
              icon={
                <Heart
                  className={cn(
                    "h-[18px] w-[18px] transition-transform",
                    liked ? "fill-like text-like scale-110" : "",
                  )}
                  strokeWidth={1.8}
                />
              }
              count={likes}
              active={liked}
              activeColor="text-like"
              hoverClass="group-hover:text-like group-hover:bg-like/10"
              textClass="group-hover:text-like"
            />
            <ActionBtn
              label="Views"
              onClick={() => { if (isOwner) nav(`/p/${post.id}/insights`); }}
              icon={<BarChart3 className="h-[18px] w-[18px]" strokeWidth={1.8} />}
              count={views}
              hoverClass="group-hover:text-primary group-hover:bg-primary/10"
              textClass="group-hover:text-primary"
            />
            <ActionBtn
              label="Save"
              onClick={toggleSave}
              icon={
                <Bookmark
                  className={cn("h-[18px] w-[18px]", saved && "fill-primary text-primary")}
                  strokeWidth={1.8}
                />
              }
              active={saved}
              activeColor="text-primary"
              hoverClass="group-hover:text-primary group-hover:bg-primary/10"
              textClass="group-hover:text-primary"
            />
            <ActionBtn
              label="Share"
              onClick={() => setShareOpen(true)}
              icon={<Send className="h-[18px] w-[18px]" strokeWidth={1.8} />}
              hoverClass="group-hover:text-primary group-hover:bg-primary/10"
              textClass="group-hover:text-primary"
            />
          </div>

          {isFounder && (
            <div className="mt-1">
              <GenesisMark />
            </div>
          )}
        </div>
      </div>

      <ShareToDM postId={post.id} open={shareOpen} onOpenChange={setShareOpen} />
      <SaveToCollectionSheet postId={post.id} open={collectionOpen} onOpenChange={setCollectionOpen} />
      <ReportSheet open={reportOpen} onOpenChange={setReportOpen} targetKind="post" targetId={post.id} />
      <TipSheet
        open={tipOpen}
        onOpenChange={setTipOpen}
        recipientId={post.user_id}
        recipientName={handle}
        postId={post.id}
      />
    </article>
  );
};

const ActionBtn = ({
  label,
  onClick,
  icon,
  count,
  active,
  activeColor,
  hoverClass,
  textClass,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  activeColor?: string;
  hoverClass?: string;
  textClass?: string;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={cn(
      "group inline-flex items-center gap-0.5 rounded-full transition-colors active:scale-95 duration-fast",
      active && activeColor,
    )}
  >
    <span
      className={cn(
        "grid place-items-center h-[30px] w-[30px] rounded-full transition-colors",
        hoverClass,
      )}
    >
      {icon}
    </span>
    {count !== undefined && count > 0 && (
      <span className={cn("pr-1 text-[13px] leading-none tabular-nums transition-colors", active ? activeColor : textClass)}>
        {fmt(count)}
      </span>
    )}
  </button>
);
