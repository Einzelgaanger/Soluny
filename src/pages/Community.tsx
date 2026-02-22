import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Search, User, Users, Send, ArrowLeft, MessageSquare } from "lucide-react";
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
      .select("user_id, display_name, username, avatar_url, rank, cp_balance, total_earnings_kes")
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
      .select("user_id, display_name, username, avatar_url, rank, cp_balance, total_earnings_kes")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);
    setResults(data || []);
    setLoading(false);
  };

  const displayList = results.length > 0 ? results : topUsers;

  const renderUserCard = (p: any) => {
    const rank = getRankConfig(p.rank || "newcomer");
    return (
      <Link
        key={p.user_id}
        to={`/dashboard/user/${p.user_id}`}
        className="flex items-center gap-3 py-2.5 px-2 hover:bg-muted/5 rounded-lg transition-colors"
      >
        <div className={`${isMobile ? "h-9 w-9" : "h-11 w-11"} rounded-xl bg-secondary overflow-hidden shrink-0`}>
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
              {(p.display_name || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <img src={rank.image} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{p.display_name || "Anonymous"}</span>
            {p.username && <span className="text-[10px] text-muted-foreground">@{p.username}</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className={`font-bold ${rank.color}`}>{rank.label}</span>
            <span className="font-mono">{p.cp_balance} CP</span>
          </div>
        </div>
      </Link>
    );
  };

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
        <div className="text-xs text-muted-foreground">{results.length} result(s) for "{searchQuery}"</div>
      )}

      {initialLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No users found.
        </div>
      ) : (
        <div className="divide-y divide-border/20">{displayList.map(renderUserCard)}</div>
      )}
    </div>
  );
};

// ─── Chat View (DM with a specific user) ──────────────
const ChatView = ({ recipientId, onBack }: { recipientId: string; onBack: () => void }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        supabase.from("profiles").select("user_id, display_name, username, avatar_url, rank").eq("user_id", recipientId).single(),
      ]);
      setMessages(msgsRes.data || []);
      setRecipientProfile(profRes.data);
      await supabase.from("messages").update({ read: true }).eq("sender_id", recipientId).eq("receiver_id", user.id).eq("read", false);
    };
    loadChat();

    const channel = supabase
      .channel(`dm-${recipientId}`)
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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !newMsg.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: recipientId, body: newMsg.trim() });
    setNewMsg("");
    setSending(false);
  };

  return (
    <div className={`flex flex-col ${isMobile ? "h-[calc(100vh-10rem)]" : "h-[calc(100vh-12rem)]"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/30">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {recipientProfile && (
          <Link to={`/dashboard/user/${recipientId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className={`${isMobile ? "h-8 w-8" : "h-10 w-10"} rounded-xl bg-secondary overflow-hidden`}>
              {recipientProfile.avatar_url ? (
                <img src={recipientProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">{recipientProfile.display_name || "Anonymous"}</div>
              {recipientProfile.username && <div className="text-[10px] text-muted-foreground">@{recipientProfile.username}</div>}
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {messages.map((m: any) => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary rounded-bl-md"
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[9px] mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/30">
        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
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

// ─── Messages Tab (conversation list + search) ────────
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
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", partnerIds);
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
      {/* Search to start new conversation */}
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
              <div className="h-8 w-8 rounded-lg bg-secondary overflow-hidden shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{(p.display_name || "?")[0].toUpperCase()}</div>}
              </div>
              <div>
                <div className="text-sm font-medium">{p.display_name || "Anonymous"}</div>
                {p.username && <div className="text-[10px] text-muted-foreground">@{p.username}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No conversations yet. Search for someone above!
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {conversations.map((c) => (
            <button key={c.user_id} onClick={() => onOpenChat(c.user_id)} className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-muted/5 rounded-lg transition-colors text-left">
              <div className={`${isMobile ? "h-10 w-10" : "h-11 w-11"} rounded-xl bg-secondary overflow-hidden shrink-0`}>
                {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">{(c.display_name || "?")[0].toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold truncate">{c.display_name || "Anonymous"}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(c.last_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
                  {c.unread > 0 && (
                    <span className="ml-2 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
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

  // Sync URL param
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

  // If we're in a DM chat view
  if (chatUserId) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto animate-fade-in">
          <ChatView recipientId={chatUserId} onBack={closeChat} />
        </div>
      </DashboardLayout>
    );
  }

  // ── Desktop: side-by-side layout ──
  if (!isMobile) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight mb-4">Community</h1>
          <div className="grid grid-cols-5 gap-6" style={{ minHeight: "calc(100vh - 10rem)" }}>
            {/* People panel */}
            <div className="col-span-3 border border-border/30 rounded-2xl p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">People</h2>
              </div>
              <PeopleTab isMobile={false} />
            </div>
            {/* Messages panel */}
            <div className="col-span-2 border border-border/30 rounded-2xl p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Messages</h2>
              </div>
              <MessagesTab isMobile={false} onOpenChat={openChat} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Mobile: tabs ──
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in space-y-3">
        <h1 className="text-lg font-bold tracking-tight">Community</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-secondary/40 rounded-xl">
            <TabsTrigger value="people" className="flex-1 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-3.5 w-3.5 mr-1" /> People
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Messages
            </TabsTrigger>
          </TabsList>
          <TabsContent value="people">
            <PeopleTab isMobile={true} />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab isMobile={true} onOpenChat={openChat} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Community;
