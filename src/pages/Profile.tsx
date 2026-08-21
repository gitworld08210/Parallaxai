import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Camera,
  Check,
  Flag,
  Info,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Sparkles,
  User,
  UserPlus,
  VolumeX,
  Bookmark,
  Tag as TagIcon,
  X as XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { PostCard, type FeedPost } from "@/components/social/PostCard";
import { CommentSheet } from "@/components/social/CommentSheet";
import { ReportSheet } from "@/components/social/ReportSheet";
import { BecomeCreatorSheet } from "@/components/creator/BecomeCreatorSheet";
import { SubscribeButton } from "@/components/creator/SubscribeButton";
import { EmptyState } from "@/components/empty/EmptyState";
import { SideMenu } from "@/components/layout/SideMenu";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { VerificationBadge } from "@/components/vibe/VerificationBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { OrgLogoCard } from "@/components/profile/OrgLogoCard";
import { StickyTabs } from "@/components/profile/StickyTabs";
import { VerificationSheet } from "@/components/profile/VerificationSheet";

import { useAuth } from "@/contexts/AuthProvider";
import { useUserOrganizations } from "@/hooks/organization/useUserOrganizations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmt, gradientFor, initialsOf } from "@/lib/format";

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  verified: boolean;
  verification_kind: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_founder?: boolean | null;
  created_at?: string | null;
};

type Tab = "posts" | "media" | "organizations" | "about";

const formatJoined = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null;

const Profile = () => {
  const { username } = useParams();
  const { user, profile: me } = useAuth();
  const nav = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [reels, setReels] = useState<FeedPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posts");
  const [commentPost, setCommentPost] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [becomeOpen, setBecomeOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);

  const { memberships: rawMemberships } = useUserOrganizations(profile?.user_id ?? null);
  const memberships = useMemo(
    () =>
      [...rawMemberships].sort((a, b) => {
        if (a.is_owner !== b.is_owner) return a.is_owner ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [rawMemberships]);

  const isMe = !username || (me && username === me.username);
  const anyProfile = profile as any;
  const websiteRaw: string | null = anyProfile?.website ?? null;
  const locationRaw: string | null = anyProfile?.location ?? null;
  const joined = formatJoined(profile?.created_at);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const target = username || me?.username || user?.uid;
      if (!target) {
        setLoading(false);
        return;
      }
      
      let p: any = null;

      {
        const { data } = await supabase.from('profiles').select('*').eq('user_id', target).maybeSingle();
        if (data) p = data;
      }

      if (!p) {
        const { data } = await supabase.from('profiles').select('*').eq('username', target).maybeSingle();
        if (data) p = data;
      }

      if (!p) {
        const { data } = await supabase.from('profiles').select('*').eq('username', target.toLowerCase()).maybeSingle();
        if (data) p = data;
      }
      
      if (p) {
        setProfile({
          ...p,
          user_id: p.user_id || p.id
        } as ProfileRow);
      } else {
        setProfile(null);
      }
      setLoading(false);

      if (p) {
        const userId = p.user_id || p.id;
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_reel', false)
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: reelsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_reel', true)
          .order('created_at', { ascending: false })
          .limit(8);

        const pdata = (postsData as any[]) || [];
        const rdata = (reelsData as any[]) || [];

        let liked = new Set<string>();
        const allIds = [...pdata, ...rdata].map((d: any) => d.id);
        if (user && allIds.length) {
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.uid)
            .in('post_id', allIds);
          liked = new Set((likesData as any[] || []).map((d: any) => d.post_id));
        }
        setPosts(
          pdata
            .sort((a: any, b: any) => {
              const ap = a.is_pinned ? 1 : 0;
              const bp = b.is_pinned ? 1 : 0;
              if (ap !== bp) return bp - ap;
              return +new Date(b.created_at) - +new Date(a.created_at);
            })
            .map((d: any) => ({ ...d, liked: liked.has(d.id) })));
        setReels(rdata.map((d: any) => ({ ...d, liked: liked.has(d.id) })));

        if (user && userId !== user.uid) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.uid)
            .eq('following_id', userId)
            .limit(1);
          setIsFollowing(!!(followData as any[])?.length);
          
          const { data: blockData } = await supabase
            .from('blocks')
            .select('id')
            .eq('blocker_id', user.uid)
            .eq('blocked_id', userId)
            .limit(1);
          setIsBlocked(!!(blockData as any[])?.length);

          const { data: muteData } = await supabase
            .from('mutes')
            .select('id')
            .eq('muter_id', user.uid)
            .eq('muted_id', userId)
            .limit(1);
          setIsMuted(!!(muteData as any[])?.length);
        }
      }
    })();
  }, [username, me?.username, user?.uid]);

  // ============ Mutations ============
  const toggleBlock = async () => {
    if (!user || !profile) return;
    const blockId = `${user.uid}_${profile.user_id}`;
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('id', blockId);
      setIsBlocked(false);
      toast.success("Unblocked");
    } else {
      setIsBlocked(true);
      try {
        await supabase.from('blocks').upsert({
          id: blockId,
          blocker_id: user.uid,
          blocked_id: profile.user_id,
          created_at: new Date().toISOString()
        } as any);
        toast.success("Blocked");
      } catch (e: any) {
        setIsBlocked(false);
        toast.error(e.message);
      }
    }
  };
  const toggleMute = async () => {
    if (!user || !profile) return;
    const muteId = `${user.uid}_${profile.user_id}`;
    if (isMuted) {
      await supabase.from('mutes').delete().eq('id', muteId);
      setIsMuted(false);
      toast.success("Unmuted");
    } else {
      setIsMuted(true);
      try {
        await supabase.from('mutes').upsert({
          id: muteId,
          muter_id: user.uid,
          muted_id: profile.user_id,
          created_at: new Date().toISOString()
        } as any);
        toast.success("Muted");
      } catch (e: any) {
        setIsMuted(false);
        toast.error(e.message);
      }
    }
  };
  const toggleFollow = async () => {
    if (!user || !profile) return;
    const followId = `${user.uid}_${profile.user_id}`;
    if (isFollowing) {
      setIsFollowing(false);
      await supabase.from('follows').delete().eq('id', followId);
    } else {
      setIsFollowing(true);
      try {
        await supabase.from('follows').upsert({
          id: followId,
          follower_id: user.uid,
          following_id: profile.user_id,
          created_at: new Date().toISOString()
        } as any);
      } catch (e: any) {
        setIsFollowing(false);
        toast.error(e.message);
      }
    }
  };
  const openDM = async () => {
    if (!user || !profile) return;
    const { data, error } = await supabase.rpc("get_or_create_dm" as any, { _user1: user.uid, _user2: profile.user_id } as any);
    if (error) {
      toast.error(error.message || "Could not start chat");
      return;
    }
    if (data) nav(`/messages/${data}`);
  };
  const shareProfile = async () => {
    const url = `${window.location.origin}/u/${profile?.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.username, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {
      /* ignore */
    }
  };


  // ============ Render ============
  if (loading) {
    return (
      <div className="pb-10">
        <div className="h-14 border-b border-border" />
        <div className="h-44 sm:h-52 w-full bg-secondary animate-pulse" />
        <div className="px-4 -mt-14 space-y-3">
          <div className="h-24 w-24 rounded-full bg-secondary animate-pulse ring-4 ring-background" />
          <div className="h-6 w-40 rounded bg-secondary animate-pulse" />
          <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
        </div>
      </div>
    );
  }
  if (!profile && !loading) {
    if (isMe) {
      return (
        <div className="pb-24 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Complete your profile</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-[280px]">
            You haven't finished setting up your profile yet. Let others know who you are!
          </p>
          <Link
            to="/profile-creation"
            className="h-12 px-8 rounded-full bg-primary text-white font-bold flex items-center justify-center active:scale-95 transition-transform shadow-elevated"
          >
            Setup Profile
          </Link>
        </div>
      );
    }

    return (
      <div className="pb-24">
        <header className="sticky top-0 z-30 h-14 px-3 flex items-center gap-3 bg-background border-b border-border">
          <button
            onClick={() => nav(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight truncate">Profile</p>
          </div>
        </header>
        <EmptyState
          icon={Info}
          title="Profile not found"
          subtitle={`The user "@${username || 'user'}" could not be found. They may have changed their username or deleted their account.`}
          size="lg"
        />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "media", label: "Media" },
    { id: "organizations", label: "Organizations" },
    { id: "about", label: "About" },
  ];

  const displayName = profile.display_name || profile.username;
  const websiteHref = websiteRaw
    ? websiteRaw.startsWith("http")
      ? websiteRaw
      : `https://${websiteRaw}`
    : null;
  const websiteLabel = websiteRaw ? websiteRaw.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <div className="pb-24">
      {/* X-style top bar: back arrow + name + post count */}
      <header className="sticky top-0 z-30 h-14 px-4 flex items-center gap-4 bg-background border-b border-border">
        <button
          onClick={() => nav(-1)}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold tracking-tight truncate leading-tight">{displayName}</p>
          <p className="text-xs text-muted-foreground leading-tight">{fmt(profile.posts_count ?? 0)} posts</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={shareProfile} className="gap-2">
              <Share2 className="h-4 w-4" /> Share profile
            </DropdownMenuItem>
            {!isMe && (
              <>
                <DropdownMenuItem onClick={toggleMute} className="gap-2">
                  <VolumeX className="h-4 w-4" /> {isMuted ? "Unmute" : "Mute"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleBlock} className="gap-2 text-rose-500 focus:text-rose-500">
                  <Ban className="h-4 w-4" /> {isBlocked ? "Unblock" : "Block"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Cover image - full width */}
      <div className="relative w-full h-44 sm:h-52 bg-secondary overflow-hidden">
        <button
          type="button"
          onClick={() => profile.cover_url && setCoverPreviewOpen(true)}
          aria-label={profile.cover_url ? "View banner" : "Banner"}
          className="absolute inset-0 w-full h-full block focus:outline-none"
          disabled={!profile.cover_url}
        >
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="" className="h-full w-full object-cover" loading="eager" />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: `linear-gradient(135deg, ${gradientFor(profile.username)})` }}
            />
          )}
        </button>
        {isMe && (
          <Link
            to="/profile/edit"
            aria-label={profile.cover_url ? "Change banner" : "Add banner"}
            className="absolute bottom-3 right-3 h-8 px-3 rounded-full bg-black/60 text-white text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Camera className="h-3.5 w-3.5" />
            {profile.cover_url ? "Edit" : "Add banner"}
          </Link>
        )}
      </div>

      {/* Full-screen banner preview */}
      <AnimatePresence>
        {coverPreviewOpen && profile.cover_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCoverPreviewOpen(false)}
            className="fixed inset-0 z-[100] bg-black/95 grid place-items-center p-4"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setCoverPreviewOpen(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              src={profile.cover_url}
              alt="Banner"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile info block - X style */}
      <div className="px-4">
        {/* Avatar overlaps cover + action buttons row */}
        <div className="flex items-end justify-between -mt-12">
          <div className="relative rounded-full ring-4 ring-background bg-background z-10">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="h-24 w-24 rounded-full grid place-items-center text-xl font-bold text-foreground"
                style={{ backgroundImage: gradientFor(profile.username) }}
              >
                {initialsOf(displayName)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pb-1">
            {isMe ? (
              <>
                {(profile as any)?.is_creator && (
                  <Link
                    to="/creator/studio"
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
                  >
                    <Sparkles className="h-4 w-4" /> Studio
                  </Link>
                )}
                <Link
                  to="/profile/edit"
                  className="inline-flex items-center h-9 px-4 rounded-full border border-border text-sm font-bold hover:bg-secondary transition-colors active:scale-95"
                >
                  Edit profile
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="More actions"
                  className="grid place-items-center h-9 w-9 rounded-full border border-border hover:bg-secondary transition-colors active:scale-95"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span><MoreHorizontal className="h-4 w-4" /></span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={toggleMute} className="gap-2">
                        <VolumeX className="h-4 w-4" /> {isMuted ? "Unmute" : "Mute"} @{profile.username}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setReportOpen(true)} className="gap-2 text-destructive focus:text-destructive">
                        <Flag className="h-4 w-4" /> Report @{profile.username}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={toggleBlock} className="gap-2 text-destructive focus:text-destructive">
                        <Ban className="h-4 w-4" /> {isBlocked ? "Unblock" : "Block"} @{profile.username}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
                <button
                  type="button"
                  aria-label="Message"
                  onClick={openDM}
                  className="grid place-items-center h-9 w-9 rounded-full border border-border hover:bg-secondary transition-colors active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleFollow}
                  aria-pressed={isFollowing}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-bold transition-all active:scale-95",
                    isFollowing
                      ? "bg-background text-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 group"
                      : "bg-foreground text-background hover:opacity-90",
                  )}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-4 w-4 group-hover:hidden" />
                      <span className="group-hover:hidden">Following</span>
                      <span className="hidden group-hover:inline">Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
                <SubscribeButton creatorId={profile.user_id} creatorName={profile.username} />
              </>
            )}
          </div>
        </div>

        {/* Identity - X style: Name + verified, @handle on next line, bio, meta info */}
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex items-center gap-1 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight leading-tight">
                {displayName}
              </h1>
              {profile.verified && profile.verification_kind && (
                <button
                  type="button"
                  onClick={() => setVerifyOpen(true)}
                  aria-label="View verification details"
                  className="inline-flex"
                >
                  <VerificationBadge kind={profile.verification_kind} className="h-5 w-5" />
                </button>
              )}
              {memberships.filter((m) => m.verified).slice(0, 1).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setVerifyOpen(true)}
                  aria-label={`Affiliated with ${m.name}`}
                  className="inline-flex items-center justify-center h-5 w-5 rounded-md border border-border bg-secondary overflow-hidden ml-0.5"
                >
                  {m.logo_url ? (
                    <img src={m.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold">{m.name.slice(0, 1)}</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[15px] text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          )}

          {/* Location, link, calendar - X style inline */}
          {(locationRaw || websiteHref || joined) && (
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
              {locationRaw && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationRaw}
                </span>
              )}
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  {websiteLabel}
                </a>
              )}
              {joined && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {joined}
                </span>
              )}
            </div>
          )}

          {/* Stats - X style: Following (count) Followers (count) in one line */}
          <div className="flex items-center gap-4 text-[14px]">
            <Link to={`/u/${profile.username}/following`} className="hover:underline">
              <span className="font-bold text-foreground">{fmt(profile.following_count ?? 0)}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </Link>
            <Link to={`/u/${profile.username}/followers`} className="hover:underline">
              <span className="font-bold text-foreground">{fmt(profile.followers_count ?? 0)}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </Link>
          </div>

          {/* Affiliated organizations */}
          {memberships.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-1.5">
                Affiliated with ({memberships.length})
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto no-scrollbar" aria-label="Affiliated organizations">
                {memberships.slice(0, 8).map((m) => (
                  <OrgLogoCard key={m.id} membership={m} className="first:ml-1 last:mr-1" />
                ))}
              </div>
            </div>
          )}

          {/* Primary CTA */}
          {isMe && !(me as any)?.is_creator && (
            <button
              type="button"
              onClick={() => setBecomeOpen(true)}
              className="w-full h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-elevated active:scale-[0.98] transition-transform"
            >
              Become a creator
            </button>
          )}
        </div>
      </div>

      {/* Sticky tabs - X style with underline */}
      <div className="max-w-3xl mx-auto mt-3">
        <StickyTabs<Tab> tabs={tabs} value={tab} onChange={setTab} stickyTop={56} />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "posts" && (
              <div className="divide-y divide-border">
                {posts.length === 0 ? (
                  <EmptyState icon={Info} title="No posts yet" subtitle="When posts are published, they'll appear here." size="sm" />
                ) : (
                  posts.map((p) => <PostCard key={p.id} post={p} onOpenComments={setCommentPost} />)
                )}
              </div>
            )}

            {tab === "media" && (
              <div className="divide-y divide-border">
                {reels.length === 0 ? (
                  <EmptyState icon={TagIcon} title="No media yet" subtitle="Reels and media posts will appear here." size="sm" />
                ) : (
                  reels.map((p) => <PostCard key={p.id} post={p} onOpenComments={setCommentPost} />)
                )}
              </div>
            )}

            {tab === "organizations" && (
              <div className="px-4 py-4">
                {memberships.length === 0 ? (
                  <EmptyState icon={Bookmark} title="No organizations" subtitle="Organizations this person is part of will show here." size="sm" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {memberships.map((m) => (
                      <OrgLogoCard key={m.id} membership={m} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "about" && (
              <div className="px-4 py-5 space-y-4 text-sm">
                {profile.bio ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                ) : (
                  <p className="text-muted-foreground">No bio yet.</p>
                )}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {locationRaw && <AboutField label="Location" value={locationRaw} />}
                  {websiteHref && <AboutField label="Website" value={websiteLabel!} href={websiteHref} />}
                  {joined && <AboutField label="Joined" value={joined} />}
                </dl>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sheets */}
      <CommentSheet
        postId={commentPost}
        open={!!commentPost}
        onOpenChange={(b) => !b && setCommentPost(null)}
      />
      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetKind="profile"
        targetId={profile?.user_id ?? null}
      />
      <BecomeCreatorSheet open={becomeOpen} onOpenChange={setBecomeOpen} />
      <VerificationSheet
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        displayName={displayName}
        verificationKind={profile.verification_kind}
        memberships={memberships}
        joined={joined}
        verificationId={`AX-${profile.user_id.slice(0, 8).toUpperCase()}`}
      />
    </div>
  );
};

const IconBtn = ({
  label,
  onClick,
  children,
  asChild,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  if (asChild) return <>{children}</>;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid place-items-center h-9 w-9 rounded-full border border-border bg-background hover:bg-secondary transition-colors active:scale-95"
    >
      {children}
    </button>
  );
};

const AboutField = ({ label, value, href }: { label: string; value: string; href?: string }) => (
  <div className="rounded-xl border border-border bg-card px-3 py-2">
    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium mt-0.5 truncate">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
          {value}
        </a>
      ) : (
        value
      )}
    </dd>
  </div>
);

export default Profile;
