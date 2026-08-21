import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { PostCard, FeedPost } from "@/components/social/PostCard";
import { CommentSheet } from "@/components/social/CommentSheet";
import { supabase } from "@/integrations/supabase/client";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { fmt, gradientFor, initialsOf, timeAgo } from "@/lib/format";

import { useAuth } from "@/contexts/AuthProvider";

type Reply = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

const PostDetail = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      const { data: postData } = await supabase.from('posts').select('*').eq('id', postId).single();
      if (!postData) return;
      const data = postData as any;
      let liked = false;
      if (user) {
        const { data: likeData } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
        liked = !!likeData;
      }
      setPost({ ...data, liked });
    })();
  }, [postId, user?.id]);

  // Replies live under the post on X's permalink view, not only in a sheet.
  useEffect(() => {
    if (!postId) return;

    const fetchReplies = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setReplies(data as unknown as Reply[]);
    };
    fetchReplies();

    const channel = supabase
      .channel('post-detail-replies-' + postId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: 'post_id=eq.' + postId },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReplies((prev) => [...prev, payload.new as unknown as Reply]);
          } else if (payload.eventType === 'DELETE') {
            setReplies((prev) => prev.filter((c) => c.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  return (
    <div className="pb-24">
      {/* X permalink header - solid, back arrow + "Post" */}
      <header className="sticky top-0 z-30 h-[53px] px-4 flex items-center gap-6 bg-background border-b border-border">
        <button onClick={() => nav(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary transition-colors" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[20px] font-bold tracking-tight">Post</h1>
        <button className="ml-auto p-1.5 -mr-1.5 rounded-full hover:bg-secondary transition-colors" aria-label="More">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {!post && <p className="text-[15px] text-muted-foreground text-center py-12">Loading…</p>}

      {post && (
        <>
          {/* The focused post */}
          <div className="border-b border-border">
            <PostCard post={post} onOpenComments={() => setOpen(true)} />
          </div>

          {/* Engagement counts row - X shows aggregate stats under the focused post */}
          <div className="px-4 py-3 border-b border-border flex items-center flex-wrap gap-x-5 gap-y-1 text-[15px]">
            <Stat value={post.view_count ?? 0} label="Views" />
            <Stat value={post.like_count ?? 0} label="Likes" />
            <Stat value={post.comment_count ?? 0} label="Replies" />
          </div>

          {/* Reply composer entry point */}
          <button
            onClick={() => setOpen(true)}
            className="w-full px-4 py-3 border-b border-border text-left text-[15px] text-muted-foreground hover:bg-secondary/30 transition-colors"
          >
            Post your reply
          </button>

          {/* Replies */}
          <div className="divide-y divide-border">
            {replies.length === 0 && (
              <p className="text-[15px] text-muted-foreground text-center py-10">No replies yet.</p>
            )}
            {replies.map((r) => {
              const handle = r.profile?.username ?? "unknown";
              const name = r.profile?.display_name || handle;
              return (
                <article key={r.id} className="px-4 py-3 flex gap-3 transition-colors hover:bg-secondary/20">
                  <Link to={`/u/${handle}`} className="shrink-0">
                    {r.profile?.avatar_url ? (
                      <img src={r.profile.avatar_url} alt={name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <AuraAvatar gradient={gradientFor(handle)} size="sm" initials={initialsOf(name)} />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[15px] leading-5">
                      <Link to={`/u/${handle}`} className="font-bold truncate hover:underline">{name}</Link>
                      <span className="text-muted-foreground truncate">@{handle}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground shrink-0">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-[15px] leading-5 whitespace-pre-wrap break-words mt-0.5">{r.content}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {post && <CommentSheet postId={open ? post.id : null} open={open} onOpenChange={setOpen} />}
    </div>
  );
};

const Stat = ({ value, label }: { value: number; label: string }) => (
  <span className="inline-flex items-baseline gap-1">
    <span className="font-bold tabular-nums">{fmt(value)}</span>
    <span className="text-muted-foreground">{label}</span>
  </span>
);

export default PostDetail;
