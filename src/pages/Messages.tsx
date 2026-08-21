import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, X as XIcon, MessageCircle, Users, Settings, Mail } from "lucide-react";
import { AuraAvatar } from "@/components/vibe/AuraAvatar";
import { VerificationBadge } from "@/components/vibe/VerificationBadge";
import { EmptyState } from "@/components/empty/EmptyState";

import { useAuth } from "@/contexts/AuthProvider";
import { gradientFor, initialsOf } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NewGroupSheet } from "@/components/dm/NewGroupSheet";

/** X shows a bare time for today, weekday within the week, then a short date. */
const chatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { day: "numeric", month: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

type Conv = {
  id: string;
  last_message_at: string;
  is_group: boolean;
  title: string | null;
  avatar_url: string | null;
  members: { user_id: string; username: string; display_name: string; avatar_url: string | null; verification_kind?: string | null }[];
  last: string | null;
  last_sender_id: string | null;
  last_read: boolean;
  unread: number;
  online?: boolean;
};

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  verification_kind: string | null;
};

type Tab = "all" | "unread" | "groups" | "requests";

const Messages = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerQuery, setComposerQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [starting, setStarting] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('member_ids', [user.id])
      .order('last_message_at', { ascending: false });

    // Fetch unread counts from the dedicated unread_counts table
    const { data: unreadData } = await supabase
      .from('unread_counts')
      .select('conversation_id, count')
      .eq('user_id', user.id);

    const unreadMap: Record<string, number> = {};
    if (unreadData) {
      for (const row of unreadData) {
        unreadMap[row.conversation_id] = row.count;
      }
    }

    if (data) {
      setConvs((data as any[]).map((d: any) => ({
        id: d.id,
        last_message_at: d.last_message_at || new Date().toISOString(),
        is_group: !!d.is_group,
        title: d.title || null,
        avatar_url: d.avatar_url || null,
        members: d.members || [],
        last: d.last_message_text || null,
        last_sender_id: d.last_sender_id || null,
        last_read: !!d.last_read,
        unread: unreadMap[d.id] || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Real-time subscription for conversation updates
    if (!user) return;
    const channel = supabase.channel('user-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    const q = composerQuery.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, verification_kind')
          .ilike('username', `%${q.toLowerCase()}%`)
          .limit(12);
        if (!cancelled && data) setResults(data as any);
      } catch (e) {
        console.warn("Profile search failed", e);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [composerQuery, user?.id]);

  const filtered = useMemo(() => {
    const qStr = query.trim().toLowerCase();
    let base = convs;
    if (tab === "unread") base = base.filter((c) => c.unread > 0);
    else if (tab === "groups") base = base.filter((c) => c.is_group);
    else if (tab === "requests") base = base.filter((c) => !c.last);
    if (!qStr) return base;
    return base.filter((c) => {
      const other = c.members[0];
      const name = c.is_group ? (c.title || "Group") : (other?.display_name || other?.username || "");
      return name.toLowerCase().includes(qStr) || (c.last || "").toLowerCase().includes(qStr);
    });
  }, [convs, query, tab]);

  const unreadCount = useMemo(() => convs.filter((c) => c.unread > 0).length, [convs]);
  const groupsCount = useMemo(() => convs.filter((c) => c.is_group).length, [convs]);
  const requestsCount = useMemo(() => convs.filter((c) => !c.last).length, [convs]);

  const startChat = async (otherId: string) => {
    if (!user) return;
    setStarting(true);
    try {
      // Check if conversation already exists
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select('*')
        .eq('is_group', false)
        .contains('member_ids', [user.id]);

      const existing = (existingConvs as any[] || []).find((c: any) => c.member_ids?.includes(otherId));

      if (existing) {
        setComposerOpen(false);
        setComposerQuery("");
        nav(`/messages/${existing.id}`);
        return;
      }

      // Create new DM
      const { data: newConv, error } = await supabase.from('conversations').insert({
        member_ids: [user.uid, otherId],
        is_group: false,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        members: []
      } as any).select().single();
      if (error) throw error;

      setComposerOpen(false);
      setComposerQuery("");
      nav(`/messages/${(newConv as any).id}`);
    } catch (e: any) { toast.error(e.message || "Action failed"); } finally {
      setStarting(false);
    }
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: 0 },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "groups", label: "Groups", count: groupsCount },
    { id: "requests", label: "Requests", count: requestsCount },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* X DM header - solid black, title + actions, then search pill */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <header className="h-[53px] px-4 flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-tight">Messages</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGroupOpen(true)}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary transition-colors"
              aria-label="New group"
            >
              <Users className="h-5 w-5" />
            </button>
            <Link
              to="/settings"
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary transition-colors"
              aria-label="Message settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Search pill */}
        <div className="px-4 pb-2">
          <div className="h-9 rounded-full bg-secondary flex items-center gap-3 px-4 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary transition-colors">
            <Search className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Direct Messages"
              aria-label="Search Direct Messages"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="shrink-0">
                <span className="grid place-items-center h-[18px] w-[18px] rounded-full bg-primary">
                  <XIcon className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Inbox filters as X underline tabs */}
        <div role="tablist" className="flex">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex-1 h-[46px] text-[15px] font-semibold transition-colors hover:bg-secondary/40",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="relative inline-flex h-full items-center justify-center gap-1.5">
                  {t.label}
                  {t.count > 0 && (
                    <span className="text-[13px] font-bold text-primary">{t.count > 99 ? "99+" : t.count}</span>
                  )}
                  {active && <span className="absolute -bottom-px left-0 right-0 h-1 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation list */}
      <div>
        {loading && <p className="text-[15px] text-muted-foreground text-center py-10">Loading…</p>}
        {!loading && convs.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="Welcome to your inbox!"
            subtitle="Drop a line, share posts and more with private conversations between you and others."
            cta={{ label: "Write a message", onClick: () => setComposerOpen(true) }}
            size="lg"
          />
        )}
        {!loading && convs.length > 0 && filtered.length === 0 && (
          <p className="text-[15px] text-muted-foreground text-center py-10">No conversations found.</p>
        )}
        <ul className="divide-y divide-border">
          {filtered.map((c) => {
            const unread = c.unread > 0;
            const other = c.members[0];
            const name = c.is_group
              ? (c.title || c.members.map((m) => m.display_name || m.username).slice(0, 3).join(", ") || "Group")
              : (other?.display_name || other?.username || "Conversation");
            const handle = c.is_group ? null : other?.username;
            const avatarUrl = c.is_group ? (c.avatar_url || other?.avatar_url || null) : (other?.avatar_url || null);
            const handleSeed = c.is_group ? (c.title || c.id) : other?.username;
            return (
              <li key={c.id}>
                <Link
                  to={`/messages/${c.id}`}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/60",
                    unread && "bg-primary/[0.06]",
                  )}
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <AuraAvatar gradient={gradientFor(handleSeed)} size="sm" initials={initialsOf(name)} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name · @handle · timestamp, all one 15px line */}
                    <div className="flex items-center gap-1 text-[15px] leading-5">
                      <span className="font-bold truncate">{name}</span>
                      {!c.is_group && other?.verification_kind && (
                        <VerificationBadge kind={other.verification_kind as any} />
                      )}
                      {handle && <span className="text-muted-foreground truncate">@{handle}</span>}
                      {c.is_group && (
                        <span className="text-muted-foreground shrink-0 inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="text-muted-foreground shrink-0">·</span>
                      <span className="text-muted-foreground shrink-0">{chatTime(c.last_message_at)}</span>
                    </div>

                    {/* Preview */}
                    <p
                      className={cn(
                        "text-[15px] leading-5 truncate mt-0.5",
                        unread ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      {c.last ?? "Start a new conversation"}
                    </p>
                  </div>

                  {unread && (
                    <span className="shrink-0 self-center h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* X blue FAB - new message */}
      <button
        onClick={() => setComposerOpen(true)}
        aria-label="New message"
        className="fixed z-40 bottom-24 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground grid place-items-center shadow-elevated active:scale-95 transition-colors"
      >
        <Mail className="h-6 w-6" strokeWidth={2} />
      </button>

      {/* New chat sheet */}
      <Sheet open={composerOpen} onOpenChange={setComposerOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-2xl p-0 flex flex-col bg-background border-t border-border"
        >
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-[17px] font-bold text-left">New message</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <div className="h-9 rounded-full bg-secondary flex items-center gap-3 px-4 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary transition-colors">
              <Search className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={composerQuery}
                onChange={(e) => setComposerQuery(e.target.value)}
                placeholder="Search people"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {composerQuery.trim() && results.length === 0 && (
              <p className="text-[15px] text-muted-foreground text-center py-10">No results.</p>
            )}
            {results.map((p) => (
              <button
                key={p.user_id}
                disabled={starting}
                onClick={() => startChat(p.user_id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left disabled:opacity-50 hover:bg-secondary/30 transition-colors"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <AuraAvatar gradient={gradientFor(p.username)} size="sm" initials={initialsOf(p.display_name || p.username)} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold flex items-center gap-1 truncate">
                    {p.display_name || p.username}
                    {p.verification_kind && <VerificationBadge kind={p.verification_kind as any} />}
                  </p>
                  <p className="text-[15px] text-muted-foreground truncate leading-5">@{p.username}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <NewGroupSheet open={groupOpen} onOpenChange={setGroupOpen} />
    </div>
  );
};

export default Messages;
