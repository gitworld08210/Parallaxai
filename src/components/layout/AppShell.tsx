import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SideMenu } from "@/components/layout/SideMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/contexts/AuthProvider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export const AppShell = () => {
  const { user } = useAuth();
  const loc = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const notifQuery = query(
      collection(db, "notifications"),
      where("user_id", "==", user.uid),
      where("read", "==", false)
    );

    const unsubNotif = onSnapshot(notifQuery, (snap) => {
      setUnreadNotif(snap.size);
    });

    // Use a dedicated unread_counts collection keyed by user uid
    // Each document: { user_id, conversation_id, unread_count }
    const unreadQuery = query(
      collection(db, "unread_counts"),
      where("user_id", "==", user.uid),
      where("count", ">", 0)
    );

    const unsubDm = onSnapshot(unreadQuery, (snap) => {
      setUnreadDm(snap.size);
    });

    return () => {
      unsubNotif();
      unsubDm();
    };
  }, [user?.uid]);

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
