import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { PostCard, FeedPost } from "@/components/social/PostCard";
import { CommentSheet } from "@/components/social/CommentSheet";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/contexts/AuthProvider";

const PostDetail = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      const { data: postData } = await supabase.from('posts' as any).select('*').eq('id', postId).single();
      if (!postData) return;
      const data = postData as any;
      let liked = false;
      if (user) {
        const { data: likeData } = await supabase.from('likes' as any).select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
        liked = !!likeData;
      }
      setPost({ ...data, liked });
    })();
  }, [postId, user?.id]);

  return (
    <div>
      <header className="h-14 px-2 flex items-center justify-between border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
        <button onClick={() => nav(-1)} className="h-10 w-10 grid place-items-center" aria-label="Back">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-base font-semibold">Post</h1>
        <button className="h-10 w-10 grid place-items-center" aria-label="More">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>
      <div className="px-5 pb-6">
        {!post && <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>}
        {post && <PostCard post={post} onOpenComments={() => setOpen(true)} />}
      </div>
      {post && <CommentSheet postId={open ? post.id : null} open={open} onOpenChange={setOpen} />}
    </div>
  );
};

export default PostDetail;
