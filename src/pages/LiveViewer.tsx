import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Room, RoomEvent, RemoteTrack, Track } from "livekit-client";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ArrowLeft, Heart, Send, Users, Ticket, Crown, Gift, Lock } from "lucide-react";
import { GiftOverlay } from "@/components/live/GiftOverlay";
import { TopGifters } from "@/components/live/TopGifters";

type ChatRow = { id: string; user_id: string; body: string; created_at: string };
type Stream = {
  id: string; host_id: string; livekit_room: string; title: string | null;
  status: string; access_type: "free" | "ticket" | "subscribers_only";
  ticket_price_coins: number; allow_gifts: boolean; total_gifts: number;
};
type GiftDef = { id: string; name: string; icon: string; cost_coins: number };
type GiftEvent = { id: string; gift_id: string; coins_total: number; sender_id: string };

export default function LiveViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [chat, setChat] = useState<ChatRow[]>([]);
  const [text, setText] = useState("");
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [gifts, setGifts] = useState<GiftEvent[]>([]);
  const [flying, setFlying] = useState<{ id: string; icon: string; key: number }[]>([]);
  const [ended, setEnded] = useState(false);
  const [accessState, setAccessState] = useState<"loading" | "granted" | "needs_ticket" | "needs_sub">("loading");
  const [catalog, setCatalog] = useState<GiftDef[]>([]);
  const [giftSheet, setGiftSheet] = useState(false);
  const [buying, setBuying] = useState(false);
  const [tips, setTips] = useState(0);

  const me = user?.id ?? null;

  // Load gift catalog from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "gift_catalog"));
        const items: GiftDef[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as GiftDef[];
        setCatalog(items);
      } catch (e) {
        console.warn("Could not load gift catalog", e);
      }
    })();
  }, []);

  // Load stream + evaluate access
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const streamSnap = await getDoc(doc(db, "live_streams", id));
        if (!streamSnap.exists()) { toast.error("Stream not found"); navigate(-1); return; }
        const s = { id: streamSnap.id, ...streamSnap.data() } as Stream;
        setStream(s);
        setTips(Number(s.total_gifts ?? 0));
        if (s.status === "ended") { setEnded(true); return; }

        if (me && s.host_id === me) { setAccessState("granted"); return; }
        if (s.access_type === "free") { setAccessState("granted"); return; }
        if (!me) { setAccessState(s.access_type === "ticket" ? "needs_ticket" : "needs_sub"); return; }

        if (s.access_type === "ticket") {
          const ticketQ = query(
            collection(db, "live_tickets"),
            where("stream_id", "==", s.id),
            where("user_id", "==", me)
          );
          const ticketSnap = await getDocs(ticketQ);
          setAccessState(ticketSnap.docs.length > 0 ? "granted" : "needs_ticket");
        } else if (s.access_type === "subscribers_only") {
          const subQ = query(
            collection(db, "creator_subscriptions"),
            where("subscriber_id", "==", me),
            where("creator_id", "==", s.host_id),
            where("status", "in", ["active", "trialing"])
          );
          const subSnap = await getDocs(subQ);
          setAccessState(subSnap.docs.length > 0 ? "granted" : "needs_sub");
        }
      } catch (e: any) {
        toast.error("Could not load stream");
        navigate(-1);
      }
    })();
  }, [id, navigate, me]);

  // Connect LiveKit once access is granted (graceful fallback)
  useEffect(() => {
    if (!stream || accessState !== "granted" || ended) return;
    let mounted = true;

    (async () => {
      try {
        const tokenUrl = import.meta.env.VITE_LIVEKIT_TOKEN_URL;
        if (!tokenUrl) {
          console.warn("No VITE_LIVEKIT_TOKEN_URL configured. Video stream not available.");
          return;
        }
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: stream.livekit_room, role: "viewer", user_id: me }),
        });
        if (!res.ok) throw new Error("Token service unavailable");
        const data = await res.json();
        if (!data.token || !data.wsUrl) throw new Error("Invalid token response");

        const room = new Room();
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video && videoRef.current) track.attach(videoRef.current);
          if (track.kind === Track.Kind.Audio && audioRef.current) track.attach(audioRef.current);
        });
        room.on(RoomEvent.Disconnected, () => mounted && setEnded(true));
        await room.connect(data.wsUrl, data.token);
        roomRef.current = room;
      } catch (lkErr) {
        console.warn("LiveKit connection not available:", lkErr);
      }
    })();

    return () => { mounted = false; roomRef.current?.disconnect(); roomRef.current = null; };
  }, [accessState, stream?.id, ended]);

  // Real-time: chat, gifts, stream status via Firestore onSnapshot
  useEffect(() => {
    if (!id) return;
    const unsubs: (() => void)[] = [];

    // Chat listener
    const chatQ = query(
      collection(db, "live_chat"),
      where("stream_id", "==", id),
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
      where("stream_id", "==", id),
      orderBy("created_at", "desc"),
      limit(20)
    );
    unsubs.push(
      onSnapshot(giftsQ, (snap) => {
        const allGifts: GiftEvent[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as GiftEvent[];
        setGifts(allGifts.slice(0, 8));
        const totalCoins = allGifts.reduce((sum, g) => sum + Number(g.coins_total || 0), 0);
        setTips(totalCoins);
      })
    );

    // Stream doc listener (detect ended + viewer count)
    unsubs.push(
      onSnapshot(doc(db, "live_streams", id), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === "ended") setEnded(true);
        }
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [id, catalog]);

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

  const send = async () => {
    if (!text.trim() || !id || !me) return;
    const body = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "live_chat"), {
        stream_id: id,
        user_id: me,
        body,
        created_at: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Failed to send chat message", e);
    }
  };

  const sendHeart = async () => {
    if (!id || !me) return;
    setHearts((h) => [...h, { id: Date.now() + Math.random() }]);
  };

  const buyTicket = async () => {
    if (!stream || !me) return;
    setBuying(true);
    try {
      // TODO: Move wallet transfer logic to a Firebase Cloud Function for production security.
      // Client-side runTransaction prevents double-spend but cannot enforce authorization on the recipient credit.
      const viewerWalletRef = doc(db, "wallets", me);
      const hostWalletRef = doc(db, "wallets", stream.host_id);

      await runTransaction(db, async (transaction) => {
        const viewerSnap = await transaction.get(viewerWalletRef);
        const currentBalance = viewerSnap.exists() ? (viewerSnap.data().total || 0) : 0;
        if (currentBalance < stream.ticket_price_coins) {
          throw new Error("Insufficient coins - top up in Wallet");
        }
        const hostSnap = await transaction.get(hostWalletRef);
        const hostBalance = hostSnap.exists() ? (hostSnap.data().total || 0) : 0;

        transaction.update(viewerWalletRef, { total: currentBalance - stream.ticket_price_coins });
        if (hostSnap.exists()) {
          transaction.update(hostWalletRef, { total: hostBalance + stream.ticket_price_coins });
        } else {
          transaction.set(hostWalletRef, { user_id: stream.host_id, total: stream.ticket_price_coins });
        }
      });

      // Create ticket record (outside transaction - non-critical)
      await addDoc(collection(db, "live_tickets"), {
        stream_id: stream.id,
        user_id: me,
        coins_paid: stream.ticket_price_coins,
        created_at: serverTimestamp(),
      });
      toast.success("Unlocked!");
      setAccessState("granted");
    } catch (e: any) {
      const msg = e.message || "Purchase failed";
      if (/insufficient/i.test(msg)) toast.error("Not enough coins - top up in Wallet");
      else toast.error(msg);
    } finally { setBuying(false); }
  };

  const sendGift = async (g: GiftDef) => {
    if (!stream || !me) return;
    // Self-gift guard: prevent host from gifting themselves
    if (me === stream.host_id) {
      toast.error("Cannot gift yourself");
      return;
    }
    setGiftSheet(false);
    try {
      // TODO: Move wallet transfer logic to a Firebase Cloud Function for production security.
      // Client-side runTransaction prevents double-spend but cannot enforce authorization on the recipient credit.
      const viewerWalletRef = doc(db, "wallets", me);
      const hostWalletRef = doc(db, "wallets", stream.host_id);
      const streamRef = doc(db, "live_streams", stream.id);

      await runTransaction(db, async (transaction) => {
        const viewerSnap = await transaction.get(viewerWalletRef);
        const currentBalance = viewerSnap.exists() ? (viewerSnap.data().total || 0) : 0;
        if (currentBalance < g.cost_coins) {
          throw new Error("Insufficient coins - top up in Wallet");
        }
        const hostSnap = await transaction.get(hostWalletRef);
        const hostBalance = hostSnap.exists() ? (hostSnap.data().total || 0) : 0;

        transaction.update(viewerWalletRef, { total: currentBalance - g.cost_coins });
        if (hostSnap.exists()) {
          transaction.update(hostWalletRef, { total: hostBalance + g.cost_coins });
        } else {
          transaction.set(hostWalletRef, { user_id: stream.host_id, total: g.cost_coins });
        }

        // Record the gift event inside the transaction for atomicity
        const giftRef = doc(collection(db, "live_gifts"));
        transaction.set(giftRef, {
          stream_id: stream.id,
          gift_id: g.id,
          sender_id: me,
          coins_total: g.cost_coins,
          created_at: serverTimestamp(),
        });

        // Increment stream total_gifts inside the transaction
        transaction.update(streamRef, { total_gifts: increment(g.cost_coins) });
      });

      // Local animation
      setFlying((f) => [...f, { id: g.id, icon: g.icon, key: Date.now() + Math.random() }]);
    } catch (e: any) {
      const msg = e.message || "Gift failed";
      if (/insufficient/i.test(msg)) toast.error("Not enough coins - top up in Wallet");
      else toast.error(msg);
    }
  };

  if (ended) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-xl">This live has ended</p>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  if (accessState === "loading" || !stream) {
    return <div className="min-h-screen bg-black text-white grid place-items-center">Loading...</div>;
  }

  if (accessState !== "granted") {
    const isTicket = accessState === "needs_ticket";
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <div className="p-4">
          <button onClick={() => navigate(-1)} className="bg-white/10 rounded-full p-2"><ArrowLeft /></button>
        </div>
        <div className="flex-1 grid place-items-center px-6 text-center">
          <div className="max-w-sm">
            <div className="h-20 w-20 mx-auto rounded-full grid place-items-center bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl">
              {isTicket ? <Ticket className="h-10 w-10" /> : <Crown className="h-10 w-10" />}
            </div>
            <h1 className="text-2xl font-bold mt-6">{isTicket ? "Paid Live" : "Subscribers only"}</h1>
            <p className="text-white/70 text-sm mt-2">
              {stream.title || "Exclusive broadcast"}
            </p>
            {isTicket ? (
              <>
                <div className="mt-6 bg-white/10 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <span className="text-sm text-white/70">Ticket price</span>
                  <span className="text-2xl font-black">{stream.ticket_price_coins}</span>
                </div>
                <Button onClick={buyTicket} disabled={buying || !me} className="w-full mt-4 h-12 text-base gap-2">
                  <Lock className="h-4 w-4" /> {buying ? "Unlocking..." : `Unlock live for ${stream.ticket_price_coins} coins`}
                </Button>
                <Link to="/wallet?buy=1" className="block mt-3 text-xs text-white/60 underline">Top up coins</Link>
              </>
            ) : (
              <>
                <p className="mt-6 text-sm text-white/60">Subscribe to this creator to join their exclusive lives.</p>
                <Link to="/wallet" className="block mt-4">
                  <Button className="w-full h-12">Subscribe</Button>
                </Link>
              </>
            )}
            {!me && <Link to="/auth" className="block mt-4 text-sm text-white/70 underline">Sign in first</Link>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      <audio ref={audioRef} autoPlay />
      <div className="relative z-10 flex items-center justify-between p-4">
        <button onClick={() => navigate(-1)} className="bg-black/50 rounded-full p-2"><ArrowLeft /></button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full text-xs font-bold">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
          </div>
          {tips > 0 && (
            <div className="flex items-center gap-1 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold">
              <Gift className="w-3.5 h-3.5" /> {tips}
            </div>
          )}
        </div>
        <div />
      </div>

      {/* Top gifters */}
      <div className="relative z-10 px-4 mt-1">
        <TopGifters gifts={gifts} maxDisplay={3} />
      </div>

      {gifts.length > 0 && (
        <div className="relative z-10 px-4 flex gap-2 overflow-x-auto pb-2">
          {gifts.map((g) => {
            const def = catalog.find((c) => c.id === g.gift_id);
            return (
              <div key={g.id} className="shrink-0 bg-black/50 backdrop-blur rounded-full pl-1 pr-3 py-1 text-xs flex items-center gap-1">
                <span className="text-lg">{def?.icon ?? "🎁"}</span>
                <span className="font-bold text-yellow-400">+{g.coins_total}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1" />
      <div className="relative z-10 p-3 space-y-1 max-h-56 overflow-y-auto">
        {chat.map((m) => (
          <div key={m.id} className="text-sm bg-black/40 rounded-2xl px-3 py-1 inline-block max-w-[80%]">{m.body}</div>
        ))}
      </div>
      <div className="relative z-10 flex items-center gap-2 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Say something..."
          className="bg-white/10 border-white/20 rounded-full text-white placeholder:text-white/60"
        />
        <button onClick={send} className="bg-white/10 rounded-full p-3"><Send className="w-5 h-5" /></button>
        <button onClick={sendHeart} className="bg-white/10 rounded-full p-3"><Heart className="w-5 h-5 text-red-500 fill-red-500" /></button>
        {stream.allow_gifts && me && me !== stream.host_id && (
          <button onClick={() => setGiftSheet(true)} className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-3">
            <Gift className="w-5 h-5 text-black" />
          </button>
        )}
      </div>

      {/* Gift overlay animation */}
      <GiftOverlay gifts={flying} />

      <div className="pointer-events-none absolute inset-x-0 bottom-20">
        {hearts.map((h) => (
          <Heart key={h.id} className="absolute right-8 text-red-500 fill-red-500 animate-[float_2.5s_ease-out_forwards]" />
        ))}
      </div>

      <Sheet open={giftSheet} onOpenChange={setGiftSheet}>
        <SheetContent side="bottom" className="bg-neutral-950 text-white border-t border-white/10 rounded-t-3xl max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle className="text-white text-left flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-400" /> Send a gift
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 mt-4 pb-2">
            {catalog.map((g) => (
              <button key={g.id} onClick={() => sendGift(g)}
                className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 p-3 flex flex-col items-center gap-1 active:scale-95 transition">
                <span className="text-3xl">{g.icon}</span>
                <span className="text-[10px] text-white/70">{g.name}</span>
                <span className="text-xs font-bold text-yellow-400">{g.cost_coins}</span>
              </button>
            ))}
          </div>
          <Link to="/wallet?buy=1" className="block text-center text-xs text-white/60 underline mt-2">Top up coins</Link>
        </SheetContent>
      </Sheet>
    </div>
  );
}
