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
  MessageSquare, Check, CheckCheck, Trophy, Coins, MessageSquareText,
  Phone, Video,
} from "lucide-react";
import { getRankConfig } from "@/lib/ranks";
import { formatDistanceToNow } from "date-fns";
import ChatAvatar from "@/components/chat/ChatAvatar";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";

interface Conversation {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

// ─── Online Presence via Realtime ─────────────────────
const PRESENCE_CHANNEL = "global-presence";

export const useUpdateLastSeen = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const update = () => supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", user.id);
    update();
    const interval = setInterval(update, 60000);

    const channel = supabase.channel(PRESENCE_CHANNEL);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);
};

export const useOnlineUsers = () => {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.values(state).flat().forEach((p: any) => {
          if (p.user_id) ids.add(p.user_id);
        });
        setOnlineIds(ids);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return onlineIds;
};

const isOnline = (lastSeen: string | null) => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 120000;
};

export const useUnreadCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count: c } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);
      setCount(c || 0);
    };
    load();

    const channel = supabase
      .channel(`unread-badge-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return count;
};

// ─── Typing Indicator ─────────────────────────────────
const TypingIndicator = ({ recipientProfile }: { recipientProfile?: any }) => (
  <div className="flex justify-start mt-2">
    {recipientProfile && (
      <div className="mr-1.5 mt-auto mb-1">
        <ChatAvatar url={recipientProfile.avatar_url} name={recipientProfile.display_name} size="sm" />
      </div>
    )}
    <div className="bg-card border border-border/30 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

// ─── People Tab ────────────────────────────────────────
const PeopleTab = ({ isMobile, onViewProfile, onlineIds }: { isMobile: boolean; onViewProfile?: (id: string) => void; onlineIds?: Set<string> }) => {
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

      {results.length > 0 && <div className="text-xs text-muted-foreground">{results.length} result(s)</div>}

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
            const online = onlineIds ? onlineIds.has(p.user_id) : isOnline(p.last_seen);
            const content = (
              <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-muted/5 rounded-lg transition-colors cursor-pointer">
                <ChatAvatar url={p.avatar_url} name={p.display_name} online={online} size={isMobile ? "sm" : "md"} />
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
              </div>
            );

            if (onViewProfile) {
              return (
                <button key={p.user_id} onClick={() => onViewProfile(p.user_id)} className="w-full text-left">
                  {content}
                </button>
              );
            }
            return <Link key={p.user_id} to={`/dashboard/user/${p.user_id}`}>{content}</Link>;
          })}
        </div>
      )}
    </div>
  );
};

// ─── Profile Panel (desktop) ──────────────────────────
const ProfilePanel = ({ userId, onMessage, onClose }: { userId: string; onMessage: (id: string) => void; onClose: () => void }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [profRes, qRes, aRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("questions").select("id, title, created_at, answer_count").eq("author_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("answers").select("id, body, net_score, upvotes, created_at, question_id, earnings_awarded_kes").eq("author_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);
      setProfile(profRes.data);
      setQuestions(qRes.data || []);
      setAnswers(aRes.data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-16 text-muted-foreground text-sm">User not found</div>;

  const rank = getRankConfig(profile.rank || "newcomer");
  const online = isOnline(profile.last_seen);
  const isOwnProfile = user?.id === userId;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link to={`/dashboard/user/${userId}`} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
          Full profile →
        </Link>
      </div>

      <div className="flex flex-col items-center text-center gap-3">
        <ChatAvatar url={profile.avatar_url} name={profile.display_name} online={online} size="xl" />
        <div>
          <h2 className="text-base font-bold">{profile.display_name || "Anonymous"}</h2>
          {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <img src={rank.image} alt={rank.label} className="h-5 w-5 rounded object-cover" />
            <span className={`text-xs font-bold ${rank.color}`}>{rank.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{profile.cp_balance} CP</span>
          </div>
          {profile.bio && <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">{profile.bio}</p>}
        </div>
        {!isOwnProfile && user && (
          <Button
            size="sm"
            onClick={() => onMessage(userId)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-8 text-xs gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Send Message
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
          <MessageSquareText className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
          <div className="text-sm font-bold font-mono">{questions.length}</div>
          <div className="text-[9px] text-muted-foreground">Questions</div>
        </div>
        <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
          <Trophy className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
          <div className="text-sm font-bold font-mono">{answers.length}</div>
          <div className="text-[9px] text-muted-foreground">Answers</div>
        </div>
        <div className="rounded-xl bg-secondary/30 p-2.5 text-center">
          <Coins className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
          <div className="text-sm font-bold font-mono text-[11px]">KES {Number(profile.total_earnings_kes || 0).toLocaleString()}</div>
          <div className="text-[9px] text-muted-foreground">Earned</div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Recent Questions</h3>
        {questions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">None yet</p>
        ) : (
          <div className="space-y-1">
            {questions.map((q) => (
              <Link key={q.id} to={`/dashboard/questions/${q.id}`} className="block py-1.5 px-2 hover:bg-muted/5 rounded-lg transition-colors">
                <p className="text-xs font-medium line-clamp-1 hover:text-primary transition-colors">{q.title}</p>
                <span className="text-[9px] text-muted-foreground">{q.answer_count} answers · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Recent Answers</h3>
        {answers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">None yet</p>
        ) : (
          <div className="space-y-1">
            {answers.map((a) => (
              <Link key={a.id} to={`/dashboard/questions/${a.question_id}`} className="block py-1.5 px-2 hover:bg-muted/5 rounded-lg transition-colors">
                <p className="text-xs line-clamp-1">{a.body}</p>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                  <span>▲ {a.upvotes}</span>
                  {Number(a.earnings_awarded_kes) > 0 && <span className="text-primary font-bold">+KES {Number(a.earnings_awarded_kes).toLocaleString()}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Chat View ────────────────────────────────────────
const ChatView = ({ recipientId, onBack, embedded, onlineIds }: { recipientId: string; onBack: () => void; embedded?: boolean; onlineIds?: Set<string> }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<any[]>([]);
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

  const sendMessage = async (body: string, attachment?: { url: string; type: string; name: string }) => {
    if (!user) return;
    if (!body && !attachment) return;
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: recipientId,
      body: body || "",
      attachment_url: attachment?.url || null,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
    });
    setSending(false);
    const channelName = `typing-${[user.id, recipientId].sort().join("-")}`;
    supabase.channel(channelName).track({ user_id: user.id, typing: false });
  };

  const online = onlineIds ? onlineIds.has(recipientId) : (recipientProfile ? isOnline(recipientProfile.last_seen) : false);

  return (
    <div className="flex flex-col h-full">
      {/* Header — clean, minimal */}
      <div className="flex items-center gap-2 px-2 sm:px-3 py-2 border-b border-border/30 shrink-0 bg-background/95 backdrop-blur-sm">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {recipientProfile && (
          <Link to={`/dashboard/user/${recipientId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
            <ChatAvatar url={recipientProfile.avatar_url} name={recipientProfile.display_name} online={online} size="sm" />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{recipientProfile.display_name || "Anonymous"}</div>
              <div className="text-[10px] text-muted-foreground">
                {online ? (
                  <span className="text-success font-medium">online</span>
                ) : (
                  <span>
                    {recipientProfile.last_seen
                      ? `last seen ${formatDistanceToNow(new Date(recipientProfile.last_seen), { addSuffix: true })}`
                      : "offline"}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}
        {/* Call buttons (placeholder — coming soon) */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground" disabled title="Coming soon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground" disabled title="Coming soon">
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area — with subtle pattern background */}
      <div
        className="flex-1 overflow-y-auto min-h-0 relative"
        style={{
          backgroundColor: "hsl(var(--background))",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="py-3 px-2 sm:px-3">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-3">
                <MessageSquare className="h-6 w-6 text-primary/50" />
              </div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Say hello ✨</p>
            </div>
          )}
          {messages.map((m: any, i: number) => {
            const isMe = m.sender_id === user?.id;
            const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();
            const isConsecutive = i > 0 && messages[i - 1].sender_id === m.sender_id && !showDate;
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={isMe}
                showDate={showDate}
                isConsecutive={isConsecutive}
                recipientProfile={recipientProfile}
              />
            );
          })}
          {isTyping && <TypingIndicator recipientProfile={recipientProfile} />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onTyping={broadcastTyping}
        sending={sending}
        userId={user?.id || ""}
      />
    </div>
  );
};

// ─── Messages Tab ─────────────────────────────────────
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
          convMap.set(partnerId, { last_message: m.body || (m.attachment_type === "voice" ? "🎤 Voice note" : m.attachment_type === "image" ? "📷 Photo" : m.attachment_name ? `📎 ${m.attachment_name}` : m.body), last_at: m.created_at, unread: !m.read && m.receiver_id === user.id ? 1 : 0 });
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
              <ChatAvatar url={p.avatar_url} name={p.display_name} size="sm" />
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
              <ChatAvatar url={c.avatar_url} name={c.display_name} size={isMobile ? "sm" : "md"} />
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

// ─── Main Community Page ──────────────────────────────
const Community = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(recipientId ? "messages" : "people");
  const [chatUserId, setChatUserId] = useState<string | null>(recipientId || null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const onlineIds = useOnlineUsers();

  useUpdateLastSeen();

  useEffect(() => {
    if (recipientId) {
      setChatUserId(recipientId);
      setViewingProfileId(null);
      setActiveTab("messages");
    }
  }, [recipientId]);

  const openChat = (userId: string) => {
    setChatUserId(userId);
    setViewingProfileId(null);
    navigate(`/dashboard/community/${userId}`, { replace: true });
  };

  const closeChat = () => {
    setChatUserId(null);
    navigate("/dashboard/community", { replace: true });
  };

  const viewProfile = (userId: string) => {
    setViewingProfileId(userId);
    setChatUserId(null);
  };

  const closeProfile = () => {
    setViewingProfileId(null);
  };

  // ── MOBILE ──
  if (isMobile) {
    if (chatUserId) {
      return (
        <DashboardLayout>
          <div className="animate-fade-in fixed inset-0 z-[60] bg-background flex flex-col md:relative md:inset-auto md:z-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <ChatView recipientId={chatUserId} onBack={closeChat} onlineIds={onlineIds} />
          </div>
        </DashboardLayout>
      );
    }

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
            </TabsList>
            <TabsContent value="people">
              <PeopleTab isMobile={true} onlineIds={onlineIds} />
            </TabsContent>
            <TabsContent value="messages">
              <MessagesTab isMobile={true} onOpenChat={openChat} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // ── DESKTOP ──
  const rightPanelContent = () => {
    if (chatUserId) {
      return (
        <div className="h-full flex flex-col">
          <ChatView recipientId={chatUserId} onBack={closeChat} embedded onlineIds={onlineIds} />
        </div>
      );
    }
    if (viewingProfileId) {
      return (
        <div className="overflow-y-auto h-full pr-1">
          <ProfilePanel userId={viewingProfileId} onMessage={openChat} onClose={closeProfile} />
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessagesTab isMobile={false} onOpenChat={openChat} />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight mb-4">Community</h1>
        <div className="grid grid-cols-12 gap-4" style={{ height: "calc(100vh - 9rem)" }}>
          <div className="col-span-5 glass-card rounded-2xl p-4 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">People</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PeopleTab isMobile={false} onViewProfile={viewProfile} onlineIds={onlineIds} />
            </div>
          </div>
          <div className="col-span-7 glass-card rounded-2xl p-0 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden p-0">
              {chatUserId ? (
                <ChatView recipientId={chatUserId} onBack={closeChat} embedded onlineIds={onlineIds} />
              ) : (
                <div className="p-4 flex flex-col h-full">
                  {viewingProfileId ? (
                    <div className="overflow-y-auto h-full pr-1">
                      <ProfilePanel userId={viewingProfileId} onMessage={openChat} onClose={closeProfile} />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3 shrink-0">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</h2>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <MessagesTab isMobile={false} onOpenChat={openChat} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;
