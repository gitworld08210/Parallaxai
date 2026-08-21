import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export function useCoinBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBalance(0); setLoading(false); return; }
    
    try {
      const { data } = await supabase
        .from('wallets')
        .select('total')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setBalance((data as any).total || 0);
      }
    } catch (e) {
      console.warn("Supabase wallet fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('wallets-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: 'user_id=eq.' + user.id },
        (payload) => {
          if (payload.new) {
            setBalance((payload.new as any).total || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { balance, loading, refresh };
}
