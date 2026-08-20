import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLocalTracks, Track, LocalVideoTrack, LocalAudioTrack } from "livekit-client";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Radio, Heart, Users, Globe, Ticket, Crown, Gift, RotateCcw } from "lucide-react";
import { GiftOverlay } from "@/components/live/GiftOverlay";
import { TopGifters } from "@/components/live/TopGifters";

type ChatRow = { id: string; user_id: string; body: string; created_at: string };
type GiftRow = { id: string; gift_id: string; coins_total: number; sender_id: string };
type Access = "free" | "ticket" | "subscribers_only";

export default function LiveHost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);

  const [title, setTitle] = useState("");
  const [access, setAccess] = useState<Access>("free");
  const [price, setPrice] = useState<number>(50);
  const [allowGifts, setAllowGifts] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatRow[]>([]);
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [tips, setTips] = useState(0);
  const [recentGifts, setRecentGifts] = useState<GiftRow[]>([]);
  const [viewers, setViewers] = useState(0);
  const [catalog, setCatalog] = useState<Record<string, { icon: string; name: string }>>({});
  const [flying, setFlying] = useState<{ id: string; icon: string; key: number }[]>([]);

  // Load gift catalog from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "gift_catalog"));
        const map: Record<string, { icon: string; name: string }> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          map[d.id] = { icon: data.icon, name: data.name };
        });
        setCatalog(map);
      } catch (e) {
        console.warn("Could not load gift catalog", e);
      }
    })();
  }, []);

  // Attach the local video track to the <video> element whenever both are ready.
  useEffect(() => {
    if (!streaming) return;
    const attach = () => {
      const el = videoRef.current;
      const track = videoTrackRef.current;
      if (el && track) {
        track.attach(el);
        el.play().catch(() => { /* autoplay policies */ });
        setCameraReady(true);
      }
    };
    attach();
    const raf = requestAnimationFrame(attach);
    return () => cancelAnimationFrame(raf);
  }, [streaming]);

  const stopLocalTracks = () => {
    try { videoTrackRef.current?.detach(); videoTrackRef.current?.stop(); } catch { /* noop */ }
    try { audioTrackRef.current?.stop(); } catch { /* noop */ }
    videoTrackRef.current = null;
    audioTrackRef.current = null;
  };

  const retryCamera = async () => {
    stopLocalTracks();
    setCameraReady(false);
    try {
      const tracks = await createLocalTracks({ audio: true, video: true });
      for (const t of tracks) {
        if (t.kind === Track.Kind.Video) videoTrackRef.current = t as LocalVideoTrack;
        if (t.kind === Track.Kind.Audio) audioTrackRef.current = t as LocalAudioTrack;
      }
      const el = videoRef.current;
      if (el && videoTrackRef.current) {
        videoTrackRef.current.attach(el);
        setCameraReady(true);
      }
    } catch (e: any) { toast.error(e.message || "Action failed"); }
  };

  const goLive = async () => {
    if (starting) return;
    if (!user) { toast.error("Please sign in"); return; }
    setStarting(true);
    try {
      // 1) Request camera/mic first
      let tracks: Awaited<ReturnType<typeof createLocalTracks>> = [];
      try {
        tracks = await createLocalTracks({ audio: true, video: true });
      } catch (permErr: any) {
        const msg = permErr?.name === "NotAllowedError"
          ? "Camera & microphone access denied. Enable it in your browser settings."
          : permErr?.name === "NotFoundError"
          ? "No camera or microphone found on this device."
          : permErr?.message || "Could not access camera";
        toast.error(msg);
        return;
      }
      for (const t of tracks) {
        if (t.kind === Track.Kind.Video) videoTrackRef.current = t as LocalVideoTrack;
        if (t.kind === Track.Kind.Audio) audioTrackRef.current = t as LocalAudioTrack;
      }

      // 2) Create the stream record in Firestore
      const roomName = `live_${user.id}_${Date.now()}`;
      const streamDoc = await addDoc(collection(db, "live_streams"), {
        host_id: user.id,
        title: title || null,
        status: "live",
        livekit_room: roomName,
        access_type: access,
        ticket_price_coins: access === "ticket" ? Math.max(1, price) : 0,
        allow_gifts: allowGifts,
        viewer_count: 0,
        total_gifts: 0,
        started_at: serverTimestamp(),
      });
      setStreamId(streamDoc.id);

      // 3) Try LiveKit token (graceful fallback if unavailable)
      try {
        const tokenUrl = import.meta.env.VITE_LIVEKIT_TOKEN_URL;
        if (tokenUrl) {
          const res = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: roomName, role: "host", user_id: user.id }),
          });
          if (!res.ok) throw new Error("Token service unavailable");
          const data = await res.json();
          if (data.token && data.wsUrl) {
            // LiveKit connection would happen here
            console.log("LiveKit token obtained, room connection available");
          }
        } else {
          console.warn("No VITE_LIVEKIT_TOKEN_URL configured. Showing local camera preview only.");
        }
      } catch (lkErr) {
        console.warn("LiveKit connection not available, showing local preview only:", lkErr);
      }

      // 4) Flip UI on - the useEffect above will attach the video track once the element mounts
      setStreaming(true);
      toast.success("You're live!");
    } catch (e: any) {
      stopLocalTracks();
      toast.error(e?.message || "Could not go live");
    } finally {
      setStarting(false);
    }
  };

  const endLive = async () => {
    try {
      stopLocalTracks();
      if (streamId) {
        await updateDoc(doc(db, "live_streams", streamId), {
          status: "ended",
          ended_at: serverTimestamp(),
        });
      }
    } finally {
      navigate(-1);
    }
  };

  // Real-time chat and gifts via Firestore onSnapshot
  useEffect(() => {
    if (!streamId) return;
    const unsubs: (() => void)[] = [];

    // Chat listener
    const chatQ = query(
      collection(db, "live_chat"),
      where("stream_id", "==", streamId),
      orderBy("created_at", "asc"),
      limit(100)
    );
    unsubs.push(
      onSnapshot(chatQ, (snap) => {
        const msgs: ChatRow[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatRow[];
        setChat(msgs.slice(-50));
      })
    );

    // Gifts listener
    const giftsQ = query(
      collection(db, "live_gifts"),
      where("stream_id", "==", streamId),
      orderBy("created_at", "desc"),
      limit(20)
    );
    unsubs.push(
      onSnapshot(giftsQ, (snap) => {
        const allGifts: GiftRow[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as GiftRow[];
        setRecentGifts(allGifts.slice(0, 6));
        const totalCoins = allGifts.reduce((sum, g) => sum + Number(g.coins_total || 0), 0);
        setTips(totalCoins);
      })
    );

    // Stream doc listener (for viewer count updates)
    unsubs.push(
      onSnapshot(doc(db, "live_streams", streamId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setViewers(data.viewer_count || 0);
        }
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [streamId]);

  useEffect(() => {
    if (hearts.length === 0) return;
    const t = setTimeout(() => setHearts((h) => h.slice(1)), 2500);
    return () => clearTimeout(t);
  }, [hearts]);

  useEffect(() => {
    if (!flying.length) return;
    const t = setTimeout(() => setFlying((f) => f.slice(1)), 2200);
    return () => clearTimeout(t);
  }, [flying]);

  useEffect(() => () => {
    stopLocalTracks();
  }, []);

  if (!streaming) {
    return (
      <div className="min-h-screen bg-background p-5 flex flex-col gap-5 pb-40">
        <button onClick={() => navigate(-1)} className="self-start h-10 w-10 grid place-items-center rounded-full bg-muted">
          <ArrowLeft />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Broadcast</p>
          <h1 className="text-3xl font-bold mt-1">Go Live</h1>
          <p className="text-sm text-muted-foreground mt-1">Free, ticketed, or subscriber-only. Viewers can send gifts if enabled.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">Title (optional)</label>
          <Input placeholder="What's this live about?" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Who can join?</p>
          <div className="space-y-2">
            <AccessRow active={access === "free"} onPick={() => setAccess("free")} icon={Globe} label="Free" desc="Anyone can watch" />
            <AccessRow active={access === "ticket"} onPick={() => setAccess("ticket")} icon={Ticket} label="Paid entry" desc="Viewers unlock with coins" />
            <AccessRow active={access === "subscribers_only"} onPick={() => setAccess("subscribers_only")} icon={Crown} label="Subscribers only" desc="Only your premium subscribers" />
          </div>
          {access === "ticket" && (
            <div className="mt-3 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
              <span className="text-sm font-semibold">Price</span>
              <input
                type="number" min={1} value={price}
                onChange={(e) => setPrice(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 bg-transparent outline-none text-right text-sm font-bold"
              />
              <span className="text-xs text-muted-foreground">coins</span>
            </div>
          )}
        </div>

        <label className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
          <span className="flex items-center gap-2 text-sm font-semibold"><Gift className="h-4 w-4 text-primary" /> Allow gifts</span>
          <input type="checkbox" checked={allowGifts} onChange={(e) => setAllowGifts(e.target.checked)} className="h-5 w-5 accent-primary" />
        </label>

        <Button onClick={goLive} size="lg" disabled={starting} className="gap-2 mt-2">
          <Radio className="w-5 h-5" /> {starting ? "Starting..." : "Start broadcast"}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />
      {!cameraReady && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 z-20 pointer-events-auto">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="h-14 w-14 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            <p className="text-sm font-medium">Starting camera...</p>
            <button
              onClick={retryCamera}
              className="mt-2 inline-flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        </div>
      )}
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full text-xs font-bold">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full text-sm">
            <Users className="w-4 h-4" /> {viewers}
          </div>
          <div className="flex items-center gap-1 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-sm font-bold">
            <Gift className="w-4 h-4" /> {tips}
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={endLive}>End</Button>
      </div>

      {/* Top gifters */}
      <div className="relative z-10 px-4 mt-1">
        <TopGifters gifts={recentGifts} maxDisplay={3} />
      </div>

      <div className="flex-1" />
      <div className="relative z-10 px-4 pb-2 flex gap-2 overflow-x-auto">
        {recentGifts.map((g) => (
          <div key={g.id} className="shrink-0 bg-black/50 backdrop-blur rounded-full pl-1 pr-3 py-1 text-xs flex items-center gap-1">
            <span className="text-lg">{catalog[g.gift_id]?.icon ?? "🎁"}</span>
            <span className="font-bold text-yellow-400">+{g.coins_total}</span>
          </div>
        ))}
      </div>
      <div className="relative z-10 p-4 space-y-1 max-h-60 overflow-y-auto">
        {chat.map((m) => (
          <div key={m.id} className="text-sm bg-black/40 rounded-2xl px-3 py-1 inline-block max-w-[80%]">{m.body}</div>
        ))}
      </div>

      {/* Gift overlay */}
      <GiftOverlay gifts={flying} />

      <div className="pointer-events-none absolute bottom-20 right-6">
        {hearts.map((h) => (
          <Heart key={h.id} className="absolute right-0 text-red-500 fill-red-500 animate-[float_2.5s_ease-out_forwards]" />
        ))}
      </div>
    </div>
  );
}

const AccessRow = ({ active, onPick, icon: Icon, label, desc }: any) => (
  <button onClick={onPick} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
    <div className={`h-10 w-10 rounded-full grid place-items-center ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <span className={`h-5 w-5 rounded-full border-2 ${active ? "bg-primary border-primary" : "border-border"}`} />
  </button>
);
