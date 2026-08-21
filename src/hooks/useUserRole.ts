import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsModerator(false);
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles' as any)
          .select('is_admin, is_moderator')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data && !cancelled) {
          setIsAdmin(!!(data as any).is_admin);
          setIsModerator(!!(data as any).is_moderator || !!(data as any).is_admin);
        }
      } catch (e) {
        console.warn("Failed to fetch user roles from Supabase", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  return { isAdmin, isModerator, loading };
};
