import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User, Loader2, Camera, Sun, Moon, LogOut, Lock, Check,
  ChevronDown, ChevronUp, Shield, Phone, Award, Users, BadgeCheck,
  Wallet, Send, BookOpen, MessageSquare, HelpCircle, Eye, Heart,
} from "lucide-react";
import { getRankConfig, getRankProgress, getSubTier, RANKS } from "@/lib/ranks";
import { useTheme } from "@/hooks/useTheme";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { formatDistanceToNow } from "date-fns";

const Profile = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showRanks, setShowRanks] = useState(false);

  // Social
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // Activity
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myQuestions, setMyQuestions] = useState<any[]>([]);
  const [myAnswers, setMyAnswers] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [activityTab, setActivityTab] = useState("posts");

  // Wallet transfer
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferUsername, setTransferUsername] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("follows").select("follower_id").eq("following_id", user.id),
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id).order("earned_at", { ascending: false }),
      supabase.from("posts").select("id, title, type, like_count, comment_count, view_count, created_at, cover_image_url").eq("author_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("questions").select("id, title, type, answer_count, view_count, status, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("answers").select("id, body, net_score, upvotes, created_at, question_id").eq("author_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("post_comments").select("id, body, post_id, created_at, like_count").eq("author_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("wallet_transactions").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(20),
    ]).then(async ([profRes, followingRes, followersRes, badgesRes, postsRes, questionsRes, answersRes, commentsRes, walletRes]) => {
      if (profRes.data) {
        setProfile(profRes.data);
        setDisplayName(profRes.data.display_name || "");
        setUsername((profRes.data as any).username || "");
        setBio(profRes.data.bio || "");
        setPhone(profRes.data.phone_number || "");
      }
      setBadges(badgesRes.data || []);
      setMyPosts(postsRes.data || []);
      setMyQuestions(questionsRes.data || []);
      setMyAnswers(answersRes.data || []);
      setMyComments(commentsRes.data || []);
      setWalletHistory(walletRes.data || []);

      const followingIds = (followingRes.data || []).map((f: any) => f.following_id);
      const followerIds = (followersRes.data || []).map((f: any) => f.follower_id);

      if (followingIds.length > 0) {
        const { data } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url, rank, is_verified_expert").in("user_id", followingIds);
        setFollowing(data || []);
      }
      if (followerIds.length > 0) {
        const { data } = await supabase.from("profiles").select("user_id, display_name, username, avatar_url, rank, is_verified_expert").in("user_id", followerIds);
        setFollowers(data || []);
      }

      setLoading(false);
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed: " + uploadError.message); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
    setUploadingAvatar(false);
    if (updateError) toast.error(updateError.message);
    else { setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl })); toast.success("Profile picture updated!"); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    if (username) {
      const { data: existing } = await supabase.from("profiles").select("user_id").eq("username", username).neq("user_id", user.id).maybeSingle();
      if (existing) { toast.error("Username already taken"); setSaving(false); return; }
    }
    if (phone) {
      const { data: existing } = await supabase.from("profiles").select("user_id").eq("phone_number", phone).neq("user_id", user.id).maybeSingle();
      if (existing) { toast.error("Phone already registered"); setSaving(false); return; }
    }
    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio, phone_number: phone, username: username || null } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); setShowPasswordSection(false); }
  };

  const handleTransfer = async () => {
    if (!user) return;
    const amount = parseFloat(transferAmount);
    if (!amount || amount < 10) { toast.error("Minimum transfer is KES 10"); return; }
    if (!transferUsername.trim()) { toast.error("Enter a username"); return; }

    setTransferring(true);
    // Look up user by username
    const { data: receiver } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("username", transferUsername.trim().toLowerCase())
      .maybeSingle();

    if (!receiver) { toast.error("User not found"); setTransferring(false); return; }
    if (receiver.user_id === user.id) { toast.error("Cannot send to yourself"); setTransferring(false); return; }

    const { error } = await supabase.rpc("transfer_funds", {
      p_receiver_id: receiver.user_id,
      p_amount: amount,
      p_type: "transfer",
      p_note: transferNote || null,
    });
    setTransferring(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`KES ${amount} sent to ${receiver.display_name || transferUsername}!`);
      setShowTransferDialog(false);
      setTransferUsername("");
      setTransferAmount("");
      setTransferNote("");
      // Refresh balance
      const { data: p } = await supabase.from("profiles").select("available_balance_kes").eq("user_id", user.id).single();
      if (p) setProfile((prev: any) => ({ ...prev, available_balance_kes: p.available_balance_kes }));
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></DashboardLayout>;
  }

  const rank = getRankConfig(profile?.rank || "newcomer");
  const cp = profile?.cp_balance || 0;
  const cpProgress = getRankProgress(profile?.rank || "newcomer", cp);
  const sub = getSubTier(profile?.subscription_plan || "free");
  const phoneVerified = !!profile?.phone_number;
  const isVerified = profile?.is_verified_expert;
  const balance = Number(profile?.available_balance_kes || 0);

  const UserListItem = ({ p }: { p: any }) => (
    <Link to={`/dashboard/user/${p.user_id}`} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
      <ChatAvatar url={p.avatar_url} name={p.display_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold truncate">{p.display_name || "Anonymous"}</span>
          {p.is_verified_expert && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
        {p.username && <span className="text-[10px] text-muted-foreground">@{p.username}</span>}
      </div>
    </Link>
  );

  // Shared activity section
  const ActivitySection = () => (
    <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5">
      <Tabs value={activityTab} onValueChange={setActivityTab}>
        <TabsList className="w-full bg-secondary/40 rounded-xl h-8 lg:h-9 mb-3">
          <TabsTrigger value="posts" className="flex-1 rounded-lg text-[10px] lg:text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-6 lg:h-7">
            <BookOpen className="h-3 w-3 mr-1" /> Posts ({myPosts.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex-1 rounded-lg text-[10px] lg:text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-6 lg:h-7">
            <HelpCircle className="h-3 w-3 mr-1" /> Q&A ({myQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 rounded-lg text-[10px] lg:text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-6 lg:h-7">
            <MessageSquare className="h-3 w-3 mr-1" /> Comments ({myAnswers.length + myComments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {myPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No posts yet</p>
          ) : (
            <div className="divide-y divide-border/20 max-h-80 overflow-y-auto">
              {myPosts.map((p) => (
                <Link key={p.id} to={`/dashboard/feed/${p.id}`} className="block py-2 px-1 hover:bg-muted/5 rounded-lg transition-colors">
                  <h3 className="text-xs lg:text-sm font-medium hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[9px] lg:text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" /> {p.like_count}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" /> {p.comment_count}</span>
                    <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {p.view_count}</span>
                    <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions">
          {myQuestions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No questions yet</p>
          ) : (
            <div className="divide-y divide-border/20 max-h-80 overflow-y-auto">
              {myQuestions.map((q) => (
                <Link key={q.id} to={`/dashboard/questions/${q.id}`} className="block py-2 px-1 hover:bg-muted/5 rounded-lg transition-colors">
                  <h3 className="text-xs lg:text-sm font-medium hover:text-primary transition-colors line-clamp-1">{q.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[9px] lg:text-[10px] text-muted-foreground">
                    <span>{q.answer_count} answers</span>
                    <span className={q.status === "open" ? "text-green-500 font-bold" : ""}>{q.status}</span>
                    <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments">
          {myAnswers.length === 0 && myComments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No comments yet</p>
          ) : (
            <div className="divide-y divide-border/20 max-h-80 overflow-y-auto">
              {myAnswers.map((a) => (
                <Link key={`a-${a.id}`} to={`/dashboard/questions/${a.question_id}`} className="block py-2 px-1 hover:bg-muted/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-1 mb-0.5">
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Answer</span>
                  </div>
                  <p className="text-xs line-clamp-2">{a.body}</p>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                    <span>▲ {a.upvotes} · Score {a.net_score}</span>
                    <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
              {myComments.map((c) => (
                <Link key={`c-${c.id}`} to={`/dashboard/feed/${c.post_id}`} className="block py-2 px-1 hover:bg-muted/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Comment</span>
                  </div>
                  <p className="text-xs line-clamp-2">{c.body}</p>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                    <span>❤ {c.like_count}</span>
                    <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Wallet section
  const WalletSection = () => (
    <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5">
      <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> Wallet
      </h3>
      <div className="text-center mb-3">
        <div className="text-2xl lg:text-3xl font-bold font-mono text-primary">KES {balance.toFixed(0)}</div>
        <div className="text-[10px] text-muted-foreground">Available Balance</div>
      </div>
      <div className="flex gap-2 mb-3">
        <Button size="sm" onClick={() => setShowTransferDialog(true)} className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl h-8 text-xs gap-1">
          <Send className="h-3 w-3" /> Send
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/earnings")} className="flex-1 rounded-xl h-8 text-xs border-border/40">
          <Wallet className="h-3 w-3 mr-1" /> Withdraw
        </Button>
      </div>
      {walletHistory.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Recent Transfers</div>
          {walletHistory.slice(0, 5).map((tx: any) => {
            const isSender = tx.sender_id === user?.id;
            return (
              <div key={tx.id} className="flex items-center justify-between py-1 text-[10px]">
                <span className={isSender ? "text-destructive" : "text-green-500"}>
                  {isSender ? "Sent" : "Received"}
                </span>
                <span className="font-mono font-bold">{isSender ? "-" : "+"}KES {Number(tx.amount).toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const avatarDim = isMobile ? "h-14 w-14" : "h-24 w-24";
  const avatarIconSize = isMobile ? "h-6 w-6" : "h-10 w-10";
  const camSize = isMobile ? "h-5 w-5" : "h-7 w-7";
  const camIconSize = isMobile ? "h-3 w-3" : "h-4 w-4";

  return (
    <DashboardLayout>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      {isMobile ? (
        <div className="space-y-4 animate-fade-in pb-8">
          <h1 className="text-lg font-bold tracking-tight">My Profile</h1>

          {/* Avatar & rank */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="relative group">
              <div className={`${avatarDim} rounded-2xl bg-secondary border-2 border-border/40 flex items-center justify-center overflow-hidden`}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className={`${avatarIconSize} text-muted-foreground`} />}
                {uploadingAvatar && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className={`absolute -bottom-1 -right-1 ${camSize} rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md`}>
                {uploadingAvatar ? <Loader2 className={`${camIconSize} animate-spin`} /> : <Camera className={camIconSize} />}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">{displayName || "Anonymous"}</span>
                {isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </div>
              {username && <div className="text-[9px] text-muted-foreground">@{username}</div>}
              <div className="text-[10px] text-muted-foreground">{user?.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <img src={rank.image} alt={rank.label} className="h-5 w-5 rounded object-cover" />
                <span className={`text-[10px] font-bold ${rank.color}`}>{rank.label}</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">{sub.icon} {sub.name}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { setShowFollowers(!showFollowers); setShowFollowing(false); }} className="glass-card rounded-xl p-2.5 text-center hover:border-primary/20 transition-colors">
              <div className="text-base font-bold font-mono">{followers.length}</div>
              <div className="text-[9px] text-muted-foreground">Followers</div>
            </button>
            <button onClick={() => { setShowFollowing(!showFollowing); setShowFollowers(false); }} className="glass-card rounded-xl p-2.5 text-center hover:border-primary/20 transition-colors">
              <div className="text-base font-bold font-mono">{following.length}</div>
              <div className="text-[9px] text-muted-foreground">Following</div>
            </button>
            <div className="glass-card rounded-xl p-2.5 text-center">
              <div className="text-base font-bold font-mono">{myPosts.length + myQuestions.length}</div>
              <div className="text-[9px] text-muted-foreground">Posts</div>
            </div>
          </div>

          {showFollowers && (
            <div className="glass-card rounded-xl p-3 space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Followers</h3>
              {followers.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">No followers yet</p> :
                followers.map((p) => <UserListItem key={p.user_id} p={p} />)}
            </div>
          )}
          {showFollowing && (
            <div className="glass-card rounded-xl p-3 space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Following</h3>
              {following.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">Not following anyone</p> :
                following.map((p) => <UserListItem key={p.user_id} p={p} />)}
            </div>
          )}

          {/* Wallet */}
          <WalletSection />

          {/* Badges */}
          {badges.length > 0 && (
            <div className="glass-card rounded-xl p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> Badges</h3>
              <div className="flex flex-wrap gap-1.5">
                {badges.map((ub: any) => (
                  <div key={ub.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Award className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary">{ub.badges?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* XP bar */}
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className={`font-bold ${rank.color}`}>{rank.label}</span>
              <span className="text-muted-foreground">{cp} CP → {rank.nextRank}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${cpProgress}%` }} />
            </div>
          </div>

          {/* Activity tabs */}
          <ActivitySection />

          {/* Edit form */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Edit Profile</h2>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider">Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="unique_username" className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider">Phone (M-Pesa)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="254..." className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="text-xs bg-secondary/30 border-border/40 rounded-lg resize-none" placeholder="Tell us about yourself..." />
            </div>
            <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 text-xs" disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Save Changes
            </Button>
          </div>

          {/* Password */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Change Password</span>
              {showPasswordSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showPasswordSection && (
              <div className="space-y-2 pt-1">
                <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
                <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
                <Button onClick={handlePasswordChange} size="sm" disabled={changingPassword} className="bg-primary text-primary-foreground text-xs h-8">
                  {changingPassword && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Update Password
                </Button>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</h2>
            <div className="flex items-center justify-between text-xs">
              <span>Email</span>
              <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> {user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Phone</span>
              {phoneVerified ? (
                <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> {phone}</span>
              ) : (
                <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => navigate("/dashboard/verify-phone")}>
                  <Phone className="h-3 w-3 mr-1" /> Verify
                </Button>
              )}
            </div>
          </div>

          {/* Ranks */}
          <div className="glass-card rounded-xl p-4">
            <button onClick={() => setShowRanks(!showRanks)} className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>Community Ranks</span>
              {showRanks ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showRanks && (
              <div className="space-y-2 mt-3">
                {RANKS.map((r) => {
                  const isCurrent = (profile?.rank || "newcomer") === r.key;
                  return (
                    <div key={r.key} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/20"}`}>
                      <img src={r.image} alt={r.label} className="h-8 w-8 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${r.color}`}>{r.label}</div>
                        <div className="text-[9px] text-muted-foreground">{r.cpRequired}+ CP</div>
                      </div>
                      {isCurrent && <span className="text-[9px] font-bold text-primary">YOU</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme + Sign out */}
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />} Theme
            </div>
            <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs font-medium hover:bg-secondary transition-colors">
              {theme === "dark" ? <><Sun className="h-3.5 w-3.5" /> Light</> : <><Moon className="h-3.5 w-3.5" /> Dark</>}
            </button>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="w-full text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>
      ) : (
        /* ================================ DESKTOP ================================ */
        <div className="animate-fade-in pb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 text-sm font-medium hover:bg-secondary transition-colors">
                {theme === "dark" ? <><Sun className="h-4 w-4" /> Light</> : <><Moon className="h-4 w-4" /> Dark</>}
              </button>
              <Button onClick={signOut} variant="outline" size="sm" className="text-sm h-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className={`${avatarDim} rounded-2xl bg-secondary border-2 border-border/40 flex items-center justify-center overflow-hidden`}>
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className={`${avatarIconSize} text-muted-foreground`} />}
                      {uploadingAvatar && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className={`absolute -bottom-1 -right-1 ${camSize} rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90`}>
                      {uploadingAvatar ? <Loader2 className={`${camIconSize} animate-spin`} /> : <Camera className={camIconSize} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <h2 className="text-lg font-bold">{displayName || "Anonymous"}</h2>
                  {isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
                </div>
                {username && <p className="text-sm text-muted-foreground">@{username}</p>}
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <img src={rank.image} alt={rank.label} className="h-6 w-6 rounded object-cover" />
                  <span className={`text-sm font-bold ${rank.color}`}>{rank.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{sub.icon} {sub.name}</span>
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/20">
                  <button onClick={() => { setShowFollowers(!showFollowers); setShowFollowing(false); }} className="text-center hover:text-primary transition-colors">
                    <div className="text-lg font-bold font-mono">{followers.length}</div>
                    <div className="text-[10px] text-muted-foreground">Followers</div>
                  </button>
                  <button onClick={() => { setShowFollowing(!showFollowing); setShowFollowers(false); }} className="text-center hover:text-primary transition-colors">
                    <div className="text-lg font-bold font-mono">{following.length}</div>
                    <div className="text-[10px] text-muted-foreground">Following</div>
                  </button>
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono">{myPosts.length + myQuestions.length}</div>
                    <div className="text-[10px] text-muted-foreground">Posts</div>
                  </div>
                </div>

                {/* XP */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-bold ${rank.color}`}>{rank.label}</span>
                    <span className="text-muted-foreground">{rank.nextRank}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${cpProgress}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{cp} CP</div>
                </div>
              </div>

              {showFollowers && (
                <div className="glass-card rounded-2xl p-4 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Followers</h3>
                  {followers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No followers yet</p> :
                    followers.map((p) => <UserListItem key={p.user_id} p={p} />)}
                </div>
              )}
              {showFollowing && (
                <div className="glass-card rounded-2xl p-4 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Following</h3>
                  {following.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Not following anyone</p> :
                    following.map((p) => <UserListItem key={p.user_id} p={p} />)}
                </div>
              )}

              {/* Wallet */}
              <WalletSection />

              {badges.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Award className="h-4 w-4" /> Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((ub: any) => (
                      <div key={ub.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-bold text-primary">{ub.badges?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Security</h2>
                <div className="flex items-center justify-between text-sm">
                  <span>Email</span>
                  <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Verified</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Phone</span>
                  {phoneVerified ? (
                    <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {phone}</span>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate("/dashboard/verify-phone")}><Phone className="h-3 w-3 mr-1" /> Verify</Button>
                  )}
                </div>
                <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/30">
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</span>
                  {showPasswordSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showPasswordSection && (
                  <div className="space-y-3 pt-2">
                    <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                    <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                    <Button onClick={handlePasswordChange} disabled={changingPassword} className="bg-primary text-primary-foreground h-10">
                      {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Update Password
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column — Activity + Edit */}
            <div className="space-y-6">
              <ActivitySection />

              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Edit Profile</h2>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="unique_username" className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">Phone (M-Pesa)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="254..." className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="bg-secondary/30 border-border/40 rounded-lg resize-none" placeholder="Tell us about yourself..." />
                </div>
                <Button onClick={handleSave} className="bg-primary text-primary-foreground font-semibold rounded-lg h-10" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
                </Button>
              </div>
            </div>

            {/* Right Column — Ranks */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Community Ranks</h2>
                <div className="space-y-3">
                  {RANKS.map((r) => {
                    const isCurrent = (profile?.rank || "newcomer") === r.key;
                    return (
                      <div key={r.key} className={`flex items-center gap-3 p-3 rounded-xl ${isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/20"}`}>
                        <img src={r.image} alt={r.label} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold ${r.color}`}>{r.label}</div>
                          <div className="text-[10px] text-muted-foreground">{r.cpRequired}+ CP</div>
                        </div>
                        {isCurrent && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">YOU</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Send Money</DialogTitle>
            <DialogDescription className="text-xs">Transfer funds to another user by their username</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-center text-xs text-muted-foreground">
              Your balance: <span className="font-bold text-primary font-mono">KES {balance.toFixed(0)}</span>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Recipient Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  value={transferUsername}
                  onChange={(e) => setTransferUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="username"
                  className="pl-8 bg-secondary/30 border-border/40 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Amount (KES)</Label>
              <Input
                type="number"
                min="10"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="e.g. 100"
                className="bg-secondary/30 border-border/40 rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Minimum KES 10</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider mb-1 block">Note (optional)</Label>
              <Input
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="e.g. Thanks for the great article!"
                className="bg-secondary/30 border-border/40 rounded-xl"
              />
            </div>
          </div>
          <Button onClick={handleTransfer} disabled={transferring || !transferUsername || !transferAmount} className="w-full bg-primary text-primary-foreground font-bold text-xs h-9">
            {transferring && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Send KES {transferAmount || "0"} to @{transferUsername || "..."}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Profile;
