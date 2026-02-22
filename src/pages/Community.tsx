import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, Search, User, Users, Send, ArrowLeft,
  MessageSquare, Bell, Check, CheckCheck, Circle,
} from "lucide-react";
import { getRankConfig } from "@/lib/ranks";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

// ─── Online Status Hook ──────────────────────────────
const useUpdateLastSeen = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const update = () => supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", user.id);
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [user]);
};

const isOnline = (lastSeen: string | null) => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 120000; // 2 min
};

// ─── Avatar with online dot ──────────────────────────
const AvatarWithStatus = ({ url, name, online, size = "md" }: { url?: string | null; name?: string; online?: boolean; size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const dotSizes = { sm: "h-2 w-2", md: "h-2.5 w-2.5", lg: "h-3 w-3" };
  return (
    <div className="relative shrink-0">
      <div className={`${sizes[size]} rounded-xl bg-secondary overflow-hidden`}>
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
            {(name || "?")[0].toUpperCase()}
          </div>
        )}
      </div>
      {online && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} rounded-full border-2 border-background online-dot`} />
      )}
    </div>
  );
};

// ─── Typing Indicator ─────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

// ─── Read Receipt Icons ───────────────────────────────
const ReadReceipt = ({ sent, read }: { sent: boolean; read: boolean }) => {
  if (read) return <CheckCheck className="h-3 w-3 text-info inline-block" />;
  if (sent) return <Check className="h-3 w-3 text-muted-foreground/50 inline-block" />;
  return null;
};

// ─── People Tab ────────────────────────────────────────
const PeopleTab = ({ isMobile }: { isMobile: boolean }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, rank, cp_balance, total_earnings_kes, last_seen")
      .order("cp_balance", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setTopUsers(data || []);
        setInitialLoading(false);
      });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, rank, cp_balance, total_earnings_kes, last_seen")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);
    setResults(data || []);
    setLoading(false);
  };

  const displayList = results.length > 0 ? results : topUsers;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search @username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-9 text-sm bg-secondary/30 border-border/40 rounded-xl"
          />
        </div>
        <Button onClick={handleSearch} size="sm" disabled={loading} className="bg-primary text-primary-foreground rounded-xl h-9 text-xs">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="text-xs text-muted-foreground">{results.length} result(s)</div>
      )}

      {initialLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Users className="h-7 w-7 mx-auto mb-2 opacity-30" />No users found.
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {displayList.map((p: any) => {
            const rank = getRankConfig(p.rank || "newcomer");
            const online = isOnline(p.last_seen);
            return (
              <Link
                key={p.user_id}
                to={`/dashboard/user/${p.user_id}`}
                className="flex items-center gap-3 py-2.5 px-1 hover:bg-muted/5 rounded-lg transition-colors"
              >
                <AvatarWithStatus url={p.avatar_url} name={p.display_name} online={online} size={isMobile ? "sm" : "md"} />
                <img src={rank.image} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{p.display_name || "Anonymous"}</span>
                    {p.username && <span className="text-[10px] text-muted-foreground">@{p.username}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className={`font-bold ${rank.color}`}>{rank.label}</span>
                    <span className="font-mono">{p.cp_balance} CP</span>
                    {online && <span className="text-success text-[9px]">● online</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Chat View (DM with a specific user) ──────────────
const ChatView = ({ recipientId, onBack, compact }: { recipientId: string; onBack: () => void; compact?: boolean }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;
    const loadChat = async () => {
      const [msgsRes, profRes] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true })
          .limit(100),
        supabase.from("profiles").select("user_id, display_name, username, avatar_url, rank, last_seen").eq("user_id", recipientId).single(),
      ]);
      setMessages(msgsRes.data || []);
      setRecipientProfile(profRes.data);
      await supabase.from("messages").update({ read: true }).eq("sender_id", recipientId).eq("receiver_id", user.id).eq("read", false);
    };
    loadChat();

    // Realtime messages
    const channel = supabase
      .channel(`dm-${recipientId}-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (
          (msg.sender_id === user.id && msg.receiver_id === recipientId) ||
          (msg.sender_id === recipientId && msg.receiver_id === user.id)
        ) {
          setMessages((prev) => [...prev, msg]);
          if (msg.receiver_id === user.id) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as any;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, read: updated.read } : m));
      })
      .subscribe();

    // Typing presence
    const presenceChannel = supabase.channel(`typing-${[user.id, recipientId].sort().join("-")}`);
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const othersTyping = Object.values(state).flat().some(
          (p: any) => p.user_id === recipientId && p.typing
        );
        setIsTyping(othersTyping);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id, typing: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Broadcast typing status
  const broadcastTyping = useCallback(() => {
    if (!user) return;
    const channelName = `typing-${[user.id, recipientId].sort().join("-")}`;
    const ch = supabase.channel(channelName);
    ch.track({ user_id: user.id, typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      ch.track({ user_id: user.id, typing: false });
    }, 2000);
  }, [user, recipientId]);

  const sendMessage = async () => {
    if (!user || !newMsg.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: recipientId, body: newMsg.trim() });
    setNewMsg("");
    setSending(false);
    // Stop typing
    const channelName = `typing-${[user.id, recipientId].sort().join("-")}`;
    supabase.channel(channelName).track({ user_id: user.id, typing: false });
  };

  const online = recipientProfile ? isOnline(recipientProfile.last_seen) : false;
  const containerH = compact ? "h-[calc(100vh-14rem)]" : isMobile ? "h-[calc(100vh-10rem)]" : "h-[calc(100vh-12rem)]";

  return (
    <div className={`flex flex-col ${containerH}`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-2.5 border-b border-border/30">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {recipientProfile && (
          <Link to={`/dashboard/user/${recipientId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AvatarWithStatus url={recipientProfile.avatar_url} name={recipientProfile.display_name} online={online} size={isMobile ? "sm" : "md"} />
            <div>
              <div className="text-sm font-semibold">{recipientProfile.display_name || "Anonymous"}</div>
              <div className="text-[10px] text-muted-foreground">
                {recipientProfile.username && `@${recipientProfile.username} · `}
                {online ? <span className="text-success">Active now</span> : "Offline"}
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1.5">
        {messages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-xs">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-20" />
            Start a conversation!
          </div>
        )}
        {messages.map((m: any, i: number) => {
          const isMe = m.sender_id === user?.id;
          const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();
          return (
            <div key={m.id}>
              {showDate && (
                <div className="text-center text-[10px] text-muted-foreground/60 py-2">
                  {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary rounded-bl-md"
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[9px] ${isMe ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMe && <ReadReceipt sent={true} read={m.read} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-2.5 border-t border-border/30">
        <Input
          value={newMsg}
          onChange={(e) => {
            setNewMsg(e.target.value);
            broadcastTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 h-9 text-sm bg-secondary/30 border-border/40 rounded-xl"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-9 px-3">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// ─── Messages Tab (conversation list) ─────────────────
const MessagesTab = ({ isMobile, onOpenChat }: { isMobile: boolean; onOpenChat: (id: string) => void }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!msgs) { setLoading(false); return; }

      const convMap = new Map<string, { last_message: string; last_at: string; unread: number }>();
      msgs.forEach((m: any) => {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, { last_message: m.body, last_at: m.created_at, unread: !m.read && m.receiver_id === user.id ? 1 : 0 });
        } else if (!m.read && m.receiver_id === user.id) {
          convMap.get(partnerId)!.unread++;
        }
      });

      const partnerIds = [...convMap.keys()];
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url, last_seen").in("user_id", partnerIds);
        const convs: Conversation[] = partnerIds.map((pid) => {
          const prof = profiles?.find((p: any) => p.user_id === pid);
          return { user_id: pid, display_name: prof?.display_name || null, username: prof?.username || null, avatar_url: prof?.avatar_url || null, ...convMap.get(pid)! };
        });
        setConversations(convs.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq("user_id", user?.id || "")
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Find someone to message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-9 text-sm bg-secondary/30 border-border/40 rounded-xl"
          />
        </div>
        <Button onClick={handleSearch} size="sm" disabled={searching} className="bg-primary text-primary-foreground rounded-xl h-9 text-xs">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="rounded-xl border border-border/30 p-2 space-y-1">
          <div className="text-[10px] font-bold uppercase text-muted-foreground px-1 mb-1">Start a conversation</div>
          {searchResults.map((p: any) => (
            <button key={p.user_id} onClick={() => onOpenChat(p.user_id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors text-left">
              <AvatarWithStatus url={p.avatar_url} name={p.display_name} size="sm" />
              <div>
                <div className="text-sm font-medium">{p.display_name || "Anonymous"}</div>
                {p.username && <div className="text-[10px] text-muted-foreground">@{p.username}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <MessageSquare className="h-7 w-7 mx-auto mb-2 opacity-20" />
          No conversations yet.
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {conversations.map((c) => (
            <button key={c.user_id} onClick={() => onOpenChat(c.user_id)} className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-muted/5 rounded-lg transition-colors text-left">
              <AvatarWithStatus url={c.avatar_url} name={c.display_name} size={isMobile ? "sm" : "md"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">{c.display_name || "Anonymous"}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(c.last_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                  {c.unread > 0 && (
                    <span className="ml-2 h-4.5 min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Notifications Panel ──────────────────────────────
const NotificationsPanel = ({ compact }: { compact?: boolean }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setNotifications((data as Notification[]) || []);
        setLoading(false);
      });

    // Realtime
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case "earning": return "💰";
      case "rank_change": return "🏆";
      case "new_answer": return "💬";
      case "new_message": return "📩";
      default: return "🔔";
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary">{unreadCount} new</span>
          <button onClick={markAllRead} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Mark all read
          </button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          <Bell className="h-6 w-6 mx-auto mb-2 opacity-20" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`w-full text-left p-2 rounded-lg transition-colors ${
                n.read ? "opacity-60 hover:bg-muted/5" : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{n.title}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2">{n.body}</div>
                  <div className="text-[9px] text-muted-foreground/50 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Community Page ──────────────────────────────
const Community = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(recipientId ? "messages" : "people");
  const [chatUserId, setChatUserId] = useState<string | null>(recipientId || null);

  useUpdateLastSeen();

  useEffect(() => {
    if (recipientId) {
      setChatUserId(recipientId);
      setActiveTab("messages");
    }
  }, [recipientId]);

  const openChat = (userId: string) => {
    setChatUserId(userId);
    navigate(`/dashboard/community/${userId}`, { replace: true });
  };

  const closeChat = () => {
    setChatUserId(null);
    navigate("/dashboard/community", { replace: true });
  };

  // ── Chat view (both mobile and desktop) ──
  if (chatUserId) {
    return (
      <DashboardLayout>
        <div className={`${isMobile ? "" : "max-w-3xl"} mx-auto animate-fade-in`}>
          <ChatView recipientId={chatUserId} onBack={closeChat} />
        </div>
      </DashboardLayout>
    );
  }

  // ── Desktop: 3-panel layout ──
  if (!isMobile) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold tracking-tight mb-4">Community</h1>
          <div className="grid grid-cols-12 gap-4" style={{ height: "calc(100vh - 9rem)" }}>
            {/* People panel */}
            <div className="col-span-5 glass-card rounded-2xl p-4 overflow-y-auto flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">People</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PeopleTab isMobile={false} />
              </div>
            </div>
            {/* Messages panel */}
            <div className="col-span-4 glass-card rounded-2xl p-4 overflow-y-auto flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MessagesTab isMobile={false} onOpenChat={openChat} />
              </div>
            </div>
            {/* Notifications panel */}
            <div className="col-span-3 glass-card rounded-2xl p-4 overflow-y-auto flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NotificationsPanel compact />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Mobile: tabs ──
  return (
    <DashboardLayout>
      <div className="mx-auto animate-fade-in space-y-3">
        <h1 className="text-lg font-bold tracking-tight">Community</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-secondary/40 rounded-xl h-9">
            <TabsTrigger value="people" className="flex-1 rounded-lg text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
              <Users className="h-3.5 w-3.5 mr-1" /> People
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 rounded-lg text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chats
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 rounded-lg text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
              <Bell className="h-3.5 w-3.5 mr-1" /> Alerts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people">
            <PeopleTab isMobile={true} />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab isMobile={true} onOpenChat={openChat} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Community;
