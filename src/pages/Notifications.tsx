import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, BadgeDollarSign, AtSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { IncomingInvitesList } from "@/components/organization/members/IncomingInvitesList";
import { cn } from "@/lib/utils";

const Notifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(80);
      if (data) setItems(data as any[]);
    };
    fetchNotifications();

    // Real-time subscription
    const channel = supabase.channel('user-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => [payload.new as any, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i => i.id === (payload.new as any).id ? payload.new as any : i));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const visibleItems = useMemo(
    () => items.filter((n) => !n.type.startsWith("org_invite") && n.type !== "org_invited"),
    [items]
  );

  const markAllRead = async () => {
    if (!user || !items.length) return;
    const unread = items.filter(i => !i.read);
    if (!unread.length) return;

    const ids = unread.map(i => i.id);
    await supabase.from('notifications').update({ read: true }).in('id', ids);
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  /** X puts a large colored glyph in the left gutter, one color per event type. */
  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="h-[26px] w-[26px] text-like fill-like" />;
      case "repost": return <Repeat2 className="h-[26px] w-[26px] text-repost" strokeWidth={2.2} />;
      case "comment": return <MessageCircle className="h-[26px] w-[26px] text-primary" strokeWidth={2} />;
      case "follow": return <UserPlus className="h-[26px] w-[26px] text-primary" strokeWidth={2} />;
      case "post_mention": return <AtSign className="h-[26px] w-[26px] text-primary" strokeWidth={2.2} />;
      case "payout": return <BadgeDollarSign className="h-[26px] w-[26px] text-repost" strokeWidth={2} />;
      default: return <Bell className="h-[26px] w-[26px] text-primary" strokeWidth={2} />;
    }
  };

  const getText = (type: string) => {
    switch (type) {
      case "like": return "liked your post";
      case "repost": return "reposted your post";
      case "comment": return "replied to your post";
      case "follow": return "followed you";
      case "post_mention": return "mentioned you in a post";
      case "payout": return "— your payout was processed";
      default: return "sent you a notification";
    }
  };

  const getUrl = (n: any) => {
    if (n.post_id) return `/p/${n.post_id}`;
    if (n.actor?.username) return `/u/${n.actor.username}`;
    return "#";
  };

  if (!user) return null;

  return (
    <div className="pb-24 min-h-screen">
      {/* X header - solid black, 53px, no blur */}
      <header className="sticky top-0 z-30 h-[53px] px-4 flex items-center justify-between bg-background border-b border-border">
        <h1 className="text-[20px] font-bold tracking-tight">Notifications</h1>
        {visibleItems.some(i => !i.read) && (
          <button onClick={markAllRead} className="text-[15px] font-bold text-primary hover:underline">
            Mark all read
          </button>
        )}
      </header>

      {/* Pending organization invites keep their own dedicated block.
          IncomingInvitesList renders null when empty, so collapse the wrapper too. */}
      <div className="px-4 py-4 empty:hidden">
        <IncomingInvitesList />
      </div>

      <div className="divide-y divide-border">
        {visibleItems.length === 0 ? (
          <div className="py-20 px-8 text-center">
            <h2 className="text-[31px] font-extrabold leading-9 tracking-tight">Nothing to see here — yet</h2>
            <p className="text-[15px] leading-5 text-muted-foreground mt-2">
              From likes to reposts and a whole lot more, this is where all the action happens.
            </p>
          </div>
        ) : (
          visibleItems.map((n) => (
            <Link
              key={n.id}
              to={getUrl(n)}
              onClick={() => markRead(n.id)}
              className={cn(
                "flex gap-3 px-4 py-3 transition-colors active:bg-secondary/60 hover:bg-secondary/30",
                !n.read && "bg-primary/[0.06]",
              )}
            >
              {/* Left gutter: colored event glyph */}
              <div className="shrink-0 w-[26px] pt-0.5">{getIcon(n.type)}</div>

              {/* Right: actor avatar, then the sentence */}
              <div className="flex-1 min-w-0">
                <img
                  src={n.actor?.avatar_url || "/placeholder.svg"}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
                <p className="mt-2 text-[15px] leading-5">
                  <span className="font-bold">
                    {n.actor?.display_name || n.actor?.username || "Someone"}
                  </span>{" "}
                  {getText(n.type)}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>

              {!n.read && <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-2" />}
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
