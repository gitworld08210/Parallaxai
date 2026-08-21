
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/contexts/AuthProvider";
import { initialsOf } from "@/lib/format";
import { StoryViewer } from "./StoryViewer";
import { StoryRing } from "./StoryRing";

type StoryRow = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  viewers?: string[];
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

type Group = {
  user_id: string;
  profile: StoryRow["profile"];
  stories: StoryRow[];
};

export const StoriesRail = () => {
  const { user, profile: me } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);

  const load = async () => {
    if (!user?.id) { setGroups([]); return; }
    
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const map = new Map<string, Group>();
      ((data ?? []) as any[]).forEach((s: any) => {
        const g = map.get(s.user_id) ?? { user_id: s.user_id, profile: s.profile, stories: [] };
        g.stories.push(s);
        map.set(s.user_id, g);
      });
      setGroups(Array.from(map.values()));
    } catch (err) {
      console.error("Error loading stories:", err);
    }
  };


  useEffect(() => { load(); }, [user?.id]);

  const flatStories = groups.flatMap((g) => g.stories);

  return (
    <>
      <div className="px-3 py-4 flex gap-4 overflow-x-auto no-scrollbar border-b border-border">
        <Link to="/compose/story" className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]">
          <div className="relative h-[68px] w-[68px] rounded-full bg-muted grid place-items-center overflow-hidden border border-border">
            {me?.avatar_url ? (
              <img src={me.avatar_url} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="h-full w-full bg-muted grid place-items-center text-foreground font-semibold text-sm">
                {initialsOf(me?.display_name || me?.username || "Y")}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary grid place-items-center ring-2 ring-background shadow-lg shadow-primary/30">
              <Plus className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
            </span>
          </div>
          <span className="text-[11px] text-foreground truncate w-full text-center">Your story</span>
        </Link>

        {groups.filter((g) => g.user_id !== user?.id).map((g) => {
          const startIdx = flatStories.findIndex((s) => s.user_id === g.user_id);
          const hasUnseen = g.stories.some(
            (s) => !s.viewers || !s.viewers.includes(user?.id ?? "")
          );
          return (
            <button
              key={g.user_id}
              onClick={() => setViewingIdx(startIdx)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]"
            >
              <StoryRing
                avatarUrl={g.profile?.avatar_url || null}
                username={g.profile?.username || ""}
                displayName={g.profile?.display_name || ""}
                hasUnseen={hasUnseen}
                size="md"
              />
              <span className="text-[11px] truncate w-full text-center text-foreground">{g.profile?.username ?? "user"}</span>
            </button>
          );
        })}
      </div>

      {viewingIdx !== null && (
        <StoryViewer stories={flatStories} startIdx={viewingIdx} onClose={() => setViewingIdx(null)} />
      )}
    </>
  );
};
