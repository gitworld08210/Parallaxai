import { useEffect, useState } from "react";
import { TopBar } from "@/components/vibe/TopBar";
import { useAuth } from "@/contexts/AuthProvider";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Coins, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PurchaseRequest {
  id: string;
  user_id: string;
  coins: number;
  amount_inr: number;
  utr_number: string | null;
  status: string;
  created_at: any;
}

const FinanceDepartment = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "coin_purchases"),
        where("status", "==", "submitted"),
        orderBy("created_at", "desc")
      );
      const snap = await getDocs(q);
      const items: PurchaseRequest[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PurchaseRequest, "id">),
      }));
      setRequests(items);
    } catch (e) {
      console.error("Failed to load purchase requests", e);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: PurchaseRequest) => {
    if (!user) return;
    setActionLoading(req.id);
    try {
      await updateDoc(doc(db, "coin_purchases", req.id), {
        status: "approved",
        approved_at: serverTimestamp(),
        approved_by: user.id,
      });
      await updateDoc(doc(db, "wallets", req.user_id), {
        total: increment(req.coins),
      });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`Approved ${req.coins} coins for ${req.user_id}`);
    } catch (e: any) {
      toast.error(e.message || "Approve failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (req: PurchaseRequest) => {
    if (!rejectNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(req.id);
    try {
      await updateDoc(doc(db, "coin_purchases", req.id), {
        status: "rejected",
        admin_note: rejectNote.trim(),
      });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setRejectingId(null);
      setRejectNote("");
      toast.success("Request rejected");
    } catch (e: any) {
      toast.error(e.message || "Reject failed");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <TopBar title="Finance Department" subtitle="Coin Purchase Approvals" />

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
        <p className="text-xs text-muted-foreground">
          Showing requests where the user has submitted their UTR (status: &quot;submitted&quot;). These are ready for payment verification and approval.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Coins className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No submitted purchase requests awaiting review</p>
          </div>
        ) : (
          requests.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900 to-black p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-sm">{req.coins.toLocaleString("en-IN")} coins</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(req.created_at)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-mono text-[11px] truncate">{req.user_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">₹{req.amount_inr}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">UTR</p>
                  <p className="font-mono tracking-wider">{req.utr_number || "Not submitted"}</p>
                </div>
              </div>

              {rejectingId === req.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Reason for rejection..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === req.id}
                      onClick={() => handleReject(req)}
                      className="flex-1"
                    >
                      {actionLoading === req.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Confirm Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setRejectingId(null); setRejectNote(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={actionLoading === req.id}
                    onClick={() => handleApprove(req)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {actionLoading === req.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading === req.id}
                    onClick={() => setRejectingId(req.id)}
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default FinanceDepartment;
