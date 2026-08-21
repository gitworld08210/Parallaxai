import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";

type Stream = { id: string; title: string | null; host_id: string; started_at: any; viewer_count?: number };
type StreamWithProfile = Stream & { username?: string; avatar_url?: string };

export default function LiveList() {
  const navigate = useNavigate();
  const [streams, setStreams] = useState<StreamWithProfile[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('live_streams')
          .select('*')
          .eq('status', 'live')
          .order('started_at', { ascending: false });
        const rawStreams = (data as any[] || []) as Stream[];

        // Fetch host profiles
        const hostIds = rawStreams.map(s => s.host_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', hostIds);
        const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p]));

        const enriched: StreamWithProfile[] = rawStreams.map(s => {
          const prof = profileMap.get(s.host_id);
          return { ...s, username: prof?.username, avatar_url: prof?.avatar_url };
        });
        setStreams(enriched);
      } catch (e) {
        console.warn("Could not load live streams", e);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Live now</h1>
        <Button onClick={() => navigate("/live/host")} className="gap-2">
          <Radio className="w-4 h-4" /> Go Live
        </Button>
      </div>
      {streams.length === 0 && <p className="text-muted-foreground text-sm">Nobody is live right now.</p>}
      <div className="grid grid-cols-2 gap-3">
        {streams.map((s) => (
          <Link key={s.id} to={`/live/${s.id}`} className="relative aspect-[3/4] rounded-2xl bg-gradient-to-br from-pink-500 to-purple-700 p-3 flex flex-col justify-between overflow-hidden">
            <div className="self-start flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded-full text-[10px] font-bold text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
            </div>
            <div className="text-white">
              <p className="font-semibold truncate">@{s.username || "user"}</p>
              {s.title && <p className="text-xs opacity-80 truncate">{s.title}</p>}
              {typeof s.viewer_count === "number" && s.viewer_count > 0 && (
                <p className="text-[10px] opacity-60">{s.viewer_count} watching</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
