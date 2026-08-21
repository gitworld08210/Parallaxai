import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export const AppShell = () => {
  const { user } = useAuth();
  const loc = useLocation();
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchCounts = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadNotif(count || 0);

      const { count: dmCount } = await supabase
        .from('unread_counts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('count', 0);
      setUnreadDm(dmCount || 0);
    };
    fetchCounts();

    const notifChannel = supabase
      .channel('notifications-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    const dmChannel = supabase
      .channel('unread_counts-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unread_counts', filter: 'user_id=eq.' + user.id },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(dmChannel);
    };
  }, [user?.id]);

  const hideNav = ["/auth", "/onboarding", "/profile-creation"].some((p) => loc.pathname.startsWith(p));
  if (hideNav) return <Outlet />;

  return (
    <div className="min-h-screen w-full h-full bg-background text-foreground flex flex-col overflow-hidden font-sans">
      <OfflineIndicator />
      <main className="flex-1 overflow-y-auto relative outline-none no-scrollbar pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>
      <MobileNav unreadNotif={unreadNotif} unreadDm={unreadDm} />
    </div>
  );
};
