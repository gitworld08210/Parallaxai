import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SideMenu } from "@/components/layout/SideMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/contexts/AuthProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { supabase } from "@/integrations/supabase/client";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export const AppShell = () => {
  const { user } = useAuth();
  const loc = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch of notification count
    const fetchCounts = async () => {
      const { count } = await supabase
        .from('notifications' as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadNotif(count || 0);

      const { count: dmCount } = await supabase
        .from('unread_counts' as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('count', 0);
      setUnreadDm(dmCount || 0);
    };
    fetchCounts();

    // Real-time subscriptions
    const notifChannel = supabase
      .channel('notifications-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id },
        () => {
          // Refetch count on any change
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
    <div className="min-h-screen bg-[#050505] text-foreground flex justify-center items-center overflow-hidden p-0 sm:p-4 font-sans selection:bg-sky-500/30">
      <OfflineIndicator />
      <div className="w-full h-full sm:h-[844px] max-w-[440px] aspect-[9/19.5] relative flex flex-col bg-black shadow-[0_0_80px_rgba(0,0,0,0.5)] border-x border-white/5 sm:rounded-[3rem] sm:border-[12px] sm:border-zinc-900 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-50 hidden sm:block" />
        <main className="flex-1 overflow-y-auto relative outline-none no-scrollbar">
          <Outlet />
        </main>
        <MobileNav unreadNotif={unreadNotif} unreadDm={unreadDm} />
        
        {/* Removed redundant SideMenu trigger as it's now handled by profile photos in headers */}
      </div>
    </div>
  );
};
