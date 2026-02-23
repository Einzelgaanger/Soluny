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
import { toast } from "sonner";
import {
  User, Loader2, Camera, Sun, Moon, LogOut, Lock, Check,
  ChevronDown, ChevronUp, Shield, Phone, Award, Users, BadgeCheck,
} from "lucide-react";
import { getRankConfig, getRankProgress, getSubTier, RANKS } from "@/lib/ranks";
import { useTheme } from "@/hooks/useTheme";
import ChatAvatar from "@/components/chat/ChatAvatar";

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

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Ranks
  const [showRanks, setShowRanks] = useState(false);

  // Social
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("follows").select("follower_id").eq("following_id", user.id),
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id).order("earned_at", { ascending: false }),
    ]).then(async ([profRes, followingRes, followersRes, badgesRes]) => {
      if (profRes.data) {
        setProfile(profRes.data);
        setDisplayName(profRes.data.display_name || "");
        setUsername((profRes.data as any).username || "");
        setBio(profRes.data.bio || "");
        setPhone(profRes.data.phone_number || "");
      }
      setBadges(badgesRes.data || []);

      // Fetch profiles for followers/following
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
      if (existing) { toast.error("This username is already taken"); setSaving(false); return; }
    }
    if (phone) {
      const { data: existing } = await supabase.from("profiles").select("user_id").eq("phone_number", phone).neq("user_id", user.id).maybeSingle();
      if (existing) { toast.error("This phone number is already registered"); setSaving(false); return; }
    }

    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio, phone_number: phone, username: username || null } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      if (error.message.includes("profiles_username_unique")) toast.error("This username is already taken");
      else if (error.message.includes("profiles_phone_number_unique")) toast.error("This phone number is already registered");
      else toast.error(error.message);
    } else toast.success("Profile updated!");
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

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></DashboardLayout>;
  }

  const rank = getRankConfig(profile?.rank || "newcomer");
  const cp = profile?.cp_balance || 0;
  const cpProgress = getRankProgress(profile?.rank || "newcomer", cp);
  const sub = getSubTier(profile?.subscription_plan || "free");
  const phoneVerified = !!profile?.phone_number;
  const isVerified = profile?.is_verified_expert;

  const avatarDim = isMobile ? "h-14 w-14" : "h-24 w-24";
  const avatarIconSize = isMobile ? "h-6 w-6" : "h-10 w-10";
  const camSize = isMobile ? "h-5 w-5" : "h-7 w-7";
  const camIconSize = isMobile ? "h-3 w-3" : "h-4 w-4";

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

          {/* Follower/Following stats */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setShowFollowers(!showFollowers); setShowFollowing(false); }} className="glass-card rounded-xl p-3 text-center hover:border-primary/20 transition-colors">
              <div className="text-lg font-bold font-mono">{followers.length}</div>
              <div className="text-[10px] text-muted-foreground">Followers</div>
            </button>
            <button onClick={() => { setShowFollowing(!showFollowing); setShowFollowers(false); }} className="glass-card rounded-xl p-3 text-center hover:border-primary/20 transition-colors">
              <div className="text-lg font-bold font-mono">{following.length}</div>
              <div className="text-[10px] text-muted-foreground">Following</div>
            </button>
          </div>

          {/* Followers list */}
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
              {following.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">Not following anyone yet</p> :
                following.map((p) => <UserListItem key={p.user_id} p={p} />)}
            </div>
          )}

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

          {/* Change Password */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Change Password</span>
              {showPasswordSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showPasswordSection && (
              <div className="space-y-2 pt-1">
                <Input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
                <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
                <Button onClick={handlePasswordChange} size="sm" disabled={changingPassword} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                  {changingPassword && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Update Password
                </Button>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</h2>
            <div className="flex items-center justify-between text-xs">
              <span>Email verified</span>
              <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> {user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Phone</span>
              {phoneVerified ? (
                <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> {phone}</span>
              ) : (
                <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => navigate("/dashboard/verify-phone")}>
                  <Phone className="h-3 w-3 mr-1" /> Verify Phone
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
              {theme === "dark" ? <><Sun className="h-3.5 w-3.5" /> Light Mode</> : <><Moon className="h-3.5 w-3.5" /> Dark Mode</>}
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
            {/* Left Column — Profile card */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className={`${avatarDim} rounded-2xl bg-secondary border-2 border-border/40 flex items-center justify-center overflow-hidden`}>
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className={`${avatarIconSize} text-muted-foreground`} />}
                      {uploadingAvatar && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className={`absolute -bottom-1 -right-1 ${camSize} rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors`}>
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

                {/* Follower/Following stats */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/20">
                  <button onClick={() => { setShowFollowers(!showFollowers); setShowFollowing(false); }} className="text-center hover:text-primary transition-colors">
                    <div className="text-lg font-bold font-mono">{followers.length}</div>
                    <div className="text-[10px] text-muted-foreground">Followers</div>
                  </button>
                  <button onClick={() => { setShowFollowing(!showFollowing); setShowFollowers(false); }} className="text-center hover:text-primary transition-colors">
                    <div className="text-lg font-bold font-mono">{following.length}</div>
                    <div className="text-[10px] text-muted-foreground">Following</div>
                  </button>
                </div>

                {/* XP bar */}
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

              {/* Followers/Following lists */}
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
                  {following.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Not following anyone yet</p> :
                    following.map((p) => <UserListItem key={p.user_id} p={p} />)}
                </div>
              )}

              {/* Badges */}
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
                    <Input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                    <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
                    <Button onClick={handlePasswordChange} disabled={changingPassword} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10">
                      {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Update Password
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column — Edit form */}
            <div className="space-y-6">
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
                <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-10" disabled={saving}>
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
    </DashboardLayout>
  );
};

export default Profile;
