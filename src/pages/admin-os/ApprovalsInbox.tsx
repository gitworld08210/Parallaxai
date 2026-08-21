import { useState, useEffect } from "react";
import { TopBar } from "@/components/vibe/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, 
  Coins, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Layout
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ApprovalsInbox = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("finance");
  const [topups, setTopups] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      const [topupRes, verifRes, kycRes] = await Promise.all([
        supabase.from('coin_topups' as any).select('*').order('created_at', { ascending: false }),
        supabase.from('verification_requests' as any).select('*').order('created_at', { ascending: false }),
        supabase.from('virtual_world_applications' as any).select('*').order('created_at', { ascending: false }),
      ]);
      if (topupRes.data) setTopups(topupRes.data as any[]);
      if (verifRes.data) setVerifications(verifRes.data as any[]);
      if (kycRes.data) setKycRequests(kycRes.data as any[]);
      setLoading(false);
    };
    fetchData();

    // Real-time subscriptions
    const topupChannel = supabase.channel('admin-topups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coin_topups' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTopups(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTopups(prev => prev.map(t => t.id === (payload.new as any).id ? payload.new as any : t));
        } else if (payload.eventType === 'DELETE') {
          setTopups(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    const verifChannel = supabase.channel('admin-verifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVerifications(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setVerifications(prev => prev.map(v => v.id === (payload.new as any).id ? payload.new as any : v));
        } else if (payload.eventType === 'DELETE') {
          setVerifications(prev => prev.filter(v => v.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    const kycChannel = supabase.channel('admin-kyc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_world_applications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setKycRequests(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setKycRequests(prev => prev.map(k => k.id === (payload.new as any).id ? payload.new as any : k));
        } else if (payload.eventType === 'DELETE') {
          setKycRequests(prev => prev.filter(k => k.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(topupChannel);
      supabase.removeChannel(verifChannel);
      supabase.removeChannel(kycChannel);
    };
  }, []);

  const handleApproveTopup = async (topup: any) => {
    try {
      // 1. Update topup status
      const { error: topupErr } = await supabase.from('coin_topups' as any).update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewer_id: user?.id,
      } as any).eq('id', topup.id);
      if (topupErr) throw topupErr;

      // 2. Get current balance
      const { data: profileData, error: profileFetchErr } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('user_id', topup.user_id)
        .single();
      if (profileFetchErr) throw profileFetchErr;

      const currentBalance = (profileData as any)?.coin_balance || 0;

      // 3. Update profile balance
      const { error: profileErr } = await supabase.from('profiles').update({
        coin_balance: currentBalance + topup.coins,
        last_transaction_at: new Date().toISOString(),
      } as any).eq('user_id', topup.user_id);
      if (profileErr) throw profileErr;

      // 4. Add to ledger
      await supabase.from('ledger' as any).insert({
        user_id: topup.user_id,
        type: 'credit',
        amount: topup.coins,
        source: 'topup',
        reference_id: topup.id,
        label: 'Coin Purchase Approved',
        created_at: new Date().toISOString(),
      } as any);

      toast.success(`Approved ${topup.coins} coins for user`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async (tableName: string, id: string) => {
    try {
      const { error } = await supabase.from(tableName as any).update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewer_id: user?.id,
      } as any).eq('id', id);
      if (error) throw error;
      toast.success("Request rejected");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleApproveKyc = async (req: any) => {
    try {
      // 1. Update application status
      const { error: reqErr } = await supabase.from('virtual_world_applications' as any).update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewer_id: user?.id,
      } as any).eq('id', req.id);
      if (reqErr) throw reqErr;

      // 2. Grant access
      await supabase.from('virtual_world_access' as any).upsert({
        user_id: req.user_id,
        is_active: true,
        daily_limit: 25,
        approved_at: new Date().toISOString(),
        reviewer_id: user?.id,
      } as any);

      toast.success(`Approved Virtual World access for ${req.full_name}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <TopBar title="Approvals Inbox" subtitle="Admin OS / Unified Queue" />
      
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-zinc-900/50 p-1 rounded-2xl mb-6">
            <TabsTrigger value="finance" className="rounded-xl text-[11px] font-black uppercase tracking-widest">
              Finance ({topups.filter(t => t.status === 'submitted').length})
            </TabsTrigger>
            <TabsTrigger value="trust" className="rounded-xl text-[11px] font-black uppercase tracking-widest">
              Safety ({verifications.filter(v => v.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-xl text-[11px] font-black uppercase tracking-widest">
              KYC ({kycRequests.filter(k => k.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="mt-0 space-y-4">
            {topups.filter(t => t.status === 'submitted').map((topup) => (
              <div key={topup.id} className="p-5 rounded-3xl border border-white/[0.08] bg-zinc-900/20 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-orange-400/10 grid place-items-center">
                      <Coins className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">₹{topup.amount_inr} for {topup.coins} Coins</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        UTR: {topup.utr} · {topup.created_at ? format(new Date(topup.created_at), 'MMM d, HH:mm') : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleReject("coin_topups", topup.id)}
                      className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-500 grid place-items-center hover:bg-rose-500/20"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleApproveTopup(topup)}
                      className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">ID: {topup.id}</div>
              </div>
            ))}
            {topups.filter(t => t.status === 'submitted').length === 0 && (
              <div className="py-20 text-center opacity-30 space-y-2">
                <TrendingUp className="h-10 w-10 mx-auto" />
                <p className="text-sm font-bold">Finance queue clear</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trust" className="mt-0 space-y-4">
            {/* ... Verification items ... */}
            {verifications.filter(v => v.status === 'pending').map((req) => (
              <div key={req.id} className="p-5 rounded-3xl border border-white/[0.08] bg-zinc-900/20 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-blue-400/10 grid place-items-center">
                      <UserCheck className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">@{req.username}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {req.kind} Verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReject("verification_requests", req.id)} className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-500 grid place-items-center"><XCircle className="h-4 w-4" /></button>
                    <button className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center"><CheckCircle2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="kyc" className="mt-0 space-y-4">
            {kycRequests.filter(k => k.status === 'pending').map((req) => (
              <div key={req.id} className="p-5 rounded-3xl border border-white/[0.08] bg-zinc-900/20 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-400/10 grid place-items-center">
                      <ShieldCheck className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{req.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        KYC Request · {req.contact_phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReject("virtual_world_applications", req.id)} className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-500 grid place-items-center"><XCircle className="h-4 w-4" /></button>
                    <button onClick={() => handleApproveKyc(req)} className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center"><CheckCircle2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {req.purpose && <p className="text-[11px] text-zinc-400 italic">"{req.purpose}"</p>}
                <div className="grid grid-cols-3 gap-2">
                  {req.aadhaar_front_path && (
                    <div className="aspect-video rounded-lg bg-zinc-800 overflow-hidden border border-white/5">
                      <img src={req.aadhaar_front_path} alt="Front" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {req.selfie_path && (
                    <div className="aspect-square rounded-lg bg-zinc-800 overflow-hidden border border-white/5">
                      <img src={req.selfie_path} alt="Selfie" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {kycRequests.filter(k => k.status === 'pending').length === 0 && (
              <div className="py-20 text-center opacity-30 space-y-2">
                <ShieldCheck className="h-10 w-10 mx-auto" />
                <p className="text-sm font-bold">KYC queue clear</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApprovalsInbox;
