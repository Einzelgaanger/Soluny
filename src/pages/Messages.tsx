import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ArrowLeft, Search, User, MessageSquare } from "lucide-react";
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

const Messages = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!msgs) { setLoading(false); return; }

      // Group by conversation partner
      const convMap = new Map<string, { last_message: string; last_at: string; unread: number }>();
      msgs.forEach((m: any) => {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            last_message: m.body,
            last_at: m.created_at,
            unread: !m.read && m.receiver_id === user.id ? 1 : 0,
          });
        } else if (!m.read && m.receiver_id === user.id) {
          const c = convMap.get(partnerId)!;
          c.unread++;
        }
      });

      const partnerIds = [...convMap.keys()];
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", partnerIds);
        const convs: Conversation[] = partnerIds.map((pid) => {
          const prof = profiles?.find((p: any) => p.user_id === pid);
          const c = convMap.get(pid)!;
          return {
            user_id: pid,
            display_name: prof?.display_name || null,
            username: prof?.username || null,
            avatar_url: prof?.avatar_url || null,
            ...c,
          };
        });
        setConversations(convs.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()));
      }
      setLoading(false);
    };
    loadConversations();
  }, [user]);

  // Load specific conversation
  useEffect(() => {
    if (!user || !recipientId) return;
    const loadChat = async () => {
      const [msgsRes, profRes] = await Promise.all([
        supabase.from("messages").select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true })
          .limit(100),
        supabase.from("profiles").select("user_id, display_name, username, avatar_url, rank").eq("user_id", recipientId).single(),
      ]);
      setMessages(msgsRes.data || []);
      setRecipientProfile(profRes.data);

      // Mark as read
      await supabase.from("messages").update({ read: true }).eq("sender_id", recipientId).eq("receiver_id", user.id).eq("read", false);
    };
    loadChat();

    // Realtime subscription
    const channel = supabase.channel(`dm-${recipientId}`).on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const msg = payload.new as any;
        if ((msg.sender_id === user.id && msg.receiver_id === recipientId) ||
            (msg.sender_id === recipientId && msg.receiver_id === user.id)) {
          setMessages((prev) => [...prev, msg]);
          if (msg.receiver_id === user.id) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      }
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase.from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq("user_id", user?.id || "")
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendMessage = async () => {
    if (!user || !recipientId || !newMsg.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: recipientId, body: newMsg.trim() });
    setNewMsg("");
    setSending(false);
  };

  // Chat view
  if (recipientId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-3xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <Link to="/dashboard/messages" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            </Link>
            {recipientProfile && (
              <Link to={`/dashboard/user/${recipientId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-xl bg-secondary overflow-hidden">
                  {recipientProfile.avatar_url ? (
                    <img src={recipientProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                </div>
                <div>
                  <div className="text-sm lg:text-base font-semibold">{recipientProfile.display_name || "Anonymous"}</div>
                  {recipientProfile.username && <div className="text-[10px] lg:text-xs text-muted-foreground">@{recipientProfile.username}</div>}
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
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary rounded-bl-md"
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
              className="flex-1 h-9 lg:h-10 text-sm bg-secondary/30 border-border/40 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-9 lg:h-10 px-3">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Conversations list
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">Messages</h1>

        {/* Search users */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9 lg:h-10 text-sm bg-secondary/30 border-border/40 rounded-xl"
            />
          </div>
          <Button onClick={handleSearch} size="sm" disabled={searching} className="bg-primary text-primary-foreground rounded-xl h-9 lg:h-10">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="glass-card rounded-xl p-3 space-y-1">
            <div className="text-xs font-bold uppercase text-muted-foreground mb-2">Search Results</div>
            {searchResults.map((p: any) => (
              <Link key={p.user_id} to={`/dashboard/messages/${p.user_id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-secondary overflow-hidden">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{(p.display_name || "?")[0].toUpperCase()}</div>}
                </div>
                <div>
                  <div className="text-sm font-medium">{p.display_name || "Anonymous"}</div>
                  {p.username && <div className="text-[10px] text-muted-foreground">@{p.username}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No conversations yet. Search for users to start chatting!
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {conversations.map((c) => (
              <Link key={c.user_id} to={`/dashboard/messages/${c.user_id}`} className="flex items-center gap-3 py-3 px-2 hover:bg-muted/5 rounded-lg transition-colors">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-secondary overflow-hidden shrink-0">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Messages;
