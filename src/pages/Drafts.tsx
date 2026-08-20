import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, FileText, ChevronLeft, Trash2, Send } from "lucide-react";

import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";
import { collection, query, where, orderBy, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Draft = {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  status: "draft" | "scheduled";
  scheduled_for: string | null;
  created_at: string;
};

const Drafts = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<Draft[]>([]);
  const [tab, setTab] = useState<"draft" | "scheduled">("draft");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query drafts
      const draftsQuery = query(
        collection(db, "posts"),
        where("user_id", "==", user.id),
        where("status", "==", "draft"),
        orderBy("created_at", "desc")
      );
      // Query scheduled
      const scheduledQuery = query(
        collection(db, "posts"),
        where("user_id", "==", user.id),
        where("status", "==", "scheduled"),
        orderBy("created_at", "desc")
      );

      const [draftsSnap, scheduledSnap] = await Promise.all([
        getDocs(draftsQuery),
        getDocs(scheduledQuery),
      ]);

      const results: Draft[] = [];

      draftsSnap.docs.forEach((d) => {
        const data = d.data();
        results.push({
          id: d.id,
          content: data.content || "",
          media_url: data.media_url || null,
          media_type: data.media_type || null,
          status: "draft",
          scheduled_for: data.scheduled_for || null,
          created_at: data.created_at?.toDate?.() ? data.created_at.toDate().toISOString() : data.created_at || new Date().toISOString(),
        });
      });

      scheduledSnap.docs.forEach((d) => {
        const data = d.data();
        results.push({
          id: d.id,
          content: data.content || "",
          media_url: data.media_url || null,
          media_type: data.media_type || null,
          status: "scheduled",
          scheduled_for: data.scheduled_for || null,
          created_at: data.created_at?.toDate?.() ? data.created_at.toDate().toISOString() : data.created_at || new Date().toISOString(),
        });
      });

      // Sort by created_at descending
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(results);
    } catch (e: any) {
      toast.error(e.message || "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const publishNow = async (id: string) => {
    try {
      await updateDoc(doc(db, "posts", id), { status: "published", scheduled_for: null });
      toast.success("Published");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to publish");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const visible = items.filter((i) => i.status === tab);

  return (
    <div>
      <header className="h-14 px-2 flex items-center gap-2 border-b border-border">
        <button onClick={() => nav(-1)} className="p-1" aria-label="Back">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-base font-semibold">Drafts &amp; scheduled</h1>
      </header>

      <div className="flex border-b border-border">
        {[
          { id: "draft" as const, label: "Drafts", icon: FileText },
          { id: "scheduled" as const, label: "Scheduled", icon: Calendar },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-semibold relative flex items-center justify-center gap-1.5 ${tab === t.id ? "text-foreground" : "text-muted-foreground"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {tab === t.id && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-foreground" />}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border">
        {loading && <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>}
        {!loading && visible.length === 0 && (
          <div className="text-center py-16 px-6">
            <p className="text-sm text-muted-foreground mb-4">
              {tab === "draft" ? "No drafts saved." : "No scheduled posts."}
            </p>
            <Link to="/compose" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
              New post
            </Link>
          </div>
        )}
        {visible.map((d) => (
          <div key={d.id} className="flex gap-3 px-3 py-3 items-start">
            <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
              {d.media_url ? (
                d.media_type === "video"
                  ? <video src={d.media_url} muted className="h-full w-full object-cover" />
                  : <img src={d.media_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground p-1 text-center">Text</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2 break-words">{d.content || <span className="text-muted-foreground italic">No caption</span>}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {d.status === "scheduled" && d.scheduled_for
                  ? <>Scheduled for {new Date(d.scheduled_for).toLocaleString()}</>
                  : <>Saved {timeAgo(d.created_at)} ago</>}
              </p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => publishNow(d.id)} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1">
                  <Send className="h-3.5 w-3.5" /> Publish
                </button>
                <button onClick={() => remove(d.id)} className="px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-semibold inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drafts;
