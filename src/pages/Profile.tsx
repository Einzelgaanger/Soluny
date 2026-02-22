import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  User, Loader2, Camera, Sun, Moon, LogOut, Lock, Crown, Check,
  CreditCard, Smartphone, Wallet, ChevronDown, ChevronUp, Shield, Upload,
} from "lucide-react";
import { getRankConfig, getRankProgress, getSubTier, RANKS, SUB_TIERS } from "@/lib/ranks";
import { useTheme } from "@/hooks/useTheme";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
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

  // Subscription
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa" | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Withdraw
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Ranks
  const [showRanks, setShowRanks] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setPhone(data.phone_number || "");
          setMpesaPhone(data.phone_number || "");
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Add cache buster
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", user.id);

    setUploadingAvatar(false);
    if (updateError) toast.error(updateError.message);
    else {
      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Profile picture updated!");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, phone_number: phone })
      .eq("user_id", user.id);
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

  const handleSubscribe = (planId: string) => {
    if (planId === "free") return;
    setSelectedPlan(planId);
    setPaymentMethod(null);
  };

  const processPaystack = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const tier = SUB_TIERS.find((t) => t.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: { amount: tier.price, plan: tier.dbValue, callback_url: window.location.origin + "/dashboard/profile" },
      });
      if (error) throw error;
      if (data?.authorization_url) window.location.href = data.authorization_url;
      else throw new Error(data?.error || "Failed to initialize");
    } catch (err: any) { toast.error(err.message || "Payment failed"); }
    finally { setSubscribing(false); }
  };

  const processMpesa = async () => {
    if (!selectedPlan || !mpesaPhone) { toast.error("Enter your M-Pesa number"); return; }
    setSubscribing(true);
    try {
      const tier = SUB_TIERS.find((t) => t.id === selectedPlan)!;
      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: { phone_number: mpesaPhone, amount: tier.price, plan: tier.dbValue },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("STK Push sent! Check your phone.");
      setPaymentMethod(null); setSelectedPlan(null);
    } catch (err: any) { toast.error(err.message || "M-Pesa failed"); }
    finally { setSubscribing(false); }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { data, error } = await supabase.functions.invoke("mpesa-b2c-payout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Withdrawal of KES ${data.amount} initiated!`);
      setShowWithdrawDialog(false);
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (p) setProfile(p);
    } catch (err: any) { toast.error(err.message || "Withdrawal failed"); }
    finally { setWithdrawing(false); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const rank = getRankConfig(profile?.rank || "newcomer");
  const cp = profile?.cp_balance || 0;
  const cpProgress = getRankProgress(profile?.rank || "newcomer", cp);
  const sub = getSubTier(profile?.subscription_plan || "free");
  const balance = Number(profile?.available_balance_kes || 0);
  const totalEarned = Number(profile?.total_earnings_kes || 0);
  const currentPlan = profile?.subscription_plan || "free";
  const canWithdraw = balance >= 500 && balance <= sub.limits.maxWithdrawal;

  // Hidden file input
  const avatarInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleAvatarUpload}
    />
  );

  // Shared avatar component
  const AvatarBlock = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const dim = size === "lg" ? "h-24 w-24" : "h-14 w-14";
    const iconSize = size === "lg" ? "h-10 w-10" : "h-6 w-6";
    const camSize = size === "lg" ? "h-7 w-7" : "h-5 w-5";
    const camIconSize = size === "lg" ? "h-4 w-4" : "h-3 w-3";
    return (
      <div className="relative group">
        <div className={`${dim} rounded-2xl bg-secondary border-2 border-border/40 flex items-center justify-center overflow-hidden`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className={`${iconSize} text-muted-foreground`} />
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`absolute -bottom-1 -right-1 ${camSize} rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors`}
        >
          {uploadingAvatar ? <Loader2 className={`${camIconSize} animate-spin`} /> : <Camera className={camIconSize} />}
        </button>
      </div>
    );
  };

  // ================================
  // DESKTOP LAYOUT (lg+)
  // ================================
  const DesktopLayout = () => (
    <div className="hidden lg:block animate-fade-in pb-8">
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
          {/* Profile card */}
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <AvatarBlock size="lg" />
            </div>
            <h2 className="text-lg font-bold">{displayName || "Anonymous"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <img src={rank.image} alt={rank.label} className="h-6 w-6 rounded object-cover" />
              <span className={`text-sm font-bold ${rank.color}`}>{rank.animal} {rank.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{sub.icon} {sub.name}</span>
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
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-lg font-bold font-mono">{cp}</div>
              <div className="text-xs text-muted-foreground">CP</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-lg font-bold font-mono">KES {totalEarned.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-lg font-bold font-mono text-primary">KES {balance.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => setShowWithdrawDialog(true)} disabled={!canWithdraw} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10">
              <Wallet className="h-4 w-4 mr-2" /> Withdraw
            </Button>
            <Button variant="outline" className="flex-1 h-10" onClick={() => setShowSubscriptions(true)}>
              <CreditCard className="h-4 w-4 mr-2" /> Subscribe
            </Button>
          </div>

          {/* Security */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </h2>
            <div className="flex items-center justify-between text-sm">
              <span>Email</span>
              <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Verified</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Phone</span>
              <span className={phone ? "text-success font-semibold" : "text-muted-foreground"}>{phone || "Not set"}</span>
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

        {/* Middle Column — Edit form + Subscription */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Edit Profile</h2>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 bg-secondary/30 border-border/40 rounded-lg" />
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

          {/* Current plan */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Current Plan</span>
              <span className={`text-sm font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
            </div>
            {currentPlan !== "free" && profile?.subscription_expires_at && (
              <div className="text-xs text-muted-foreground mb-3">
                Expires {new Date(profile.subscription_expires_at).toLocaleDateString()}
              </div>
            )}
            <ul className="space-y-1.5 mb-4">
              <li className="text-xs text-muted-foreground">• {sub.limits.dailyAnswers === 999 ? "Unlimited" : sub.limits.dailyAnswers} answers/day</li>
              <li className="text-xs text-muted-foreground">• {sub.limits.questionsPerMonth === 999 ? "Unlimited" : sub.limits.questionsPerMonth} questions/month</li>
              <li className="text-xs text-muted-foreground">• {sub.limits.platformFee}% platform fee</li>
              <li className="text-xs text-muted-foreground">• KES {sub.limits.maxWithdrawal === 999999 ? "Unlimited" : sub.limits.maxWithdrawal.toLocaleString()} max withdrawal</li>
            </ul>
            <Button variant="outline" className="w-full h-9 text-xs" onClick={() => setShowSubscriptions(!showSubscriptions)}>
              {showSubscriptions ? "Hide Plans" : "Manage Subscription →"}
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
                      <div className={`text-sm font-bold ${r.color}`}>{r.animal} {r.label}</div>
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

      {/* Subscription plans (expandable, full width below grid) */}
      {showSubscriptions && (
        <div className="glass-card rounded-2xl p-6 mt-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" /> Subscription Plans
          </h2>
          <div className="grid grid-cols-5 gap-4">
            {SUB_TIERS.map((tier) => {
              const isCurrent = currentPlan === tier.dbValue;
              return (
                <div key={tier.id} className={`glass-card rounded-xl p-4 flex flex-col relative ${tier.id === "gold" ? "border-primary/40" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
                  {tier.id === "gold" && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</div>
                  )}
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">{tier.icon}</div>
                    <div className={`text-sm font-bold ${tier.color}`}>{tier.name}</div>
                    <div className="mt-1">
                      <span className="text-xl font-bold font-mono">{tier.price === 0 ? "Free" : `${tier.price}`}</span>
                      {tier.period && <span className="text-xs text-muted-foreground">{tier.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => handleSubscribe(tier.id)} disabled={isCurrent || tier.id === "free"} className={`w-full text-xs h-9 ${tier.id === "gold" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {isCurrent ? "Current" : tier.id === "free" ? "Free" : "Subscribe"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ================================
  // MOBILE LAYOUT (< lg)
  // ================================
  const MobileLayout = () => (
    <div className="lg:hidden space-y-4 animate-fade-in pb-8">
      <h1 className="text-lg font-bold tracking-tight">My Profile</h1>

      {/* Avatar & rank */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-4">
        <AvatarBlock size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{displayName || "Anonymous"}</div>
          <div className="text-[10px] text-muted-foreground">{user?.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <img src={rank.image} alt={rank.label} className="h-5 w-5 rounded object-cover" />
            <span className={`text-[10px] font-bold ${rank.color}`}>{rank.animal} {rank.label}</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">{sub.icon} {sub.name}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-xl p-2.5 text-center">
          <div className="text-sm font-bold font-mono">{cp}</div>
          <div className="text-[9px] text-muted-foreground">CP</div>
        </div>
        <div className="glass-card rounded-xl p-2.5 text-center">
          <div className="text-sm font-bold font-mono">KES {totalEarned.toLocaleString()}</div>
          <div className="text-[9px] text-muted-foreground">Earned</div>
        </div>
        <div className="glass-card rounded-xl p-2.5 text-center">
          <div className="text-sm font-bold font-mono text-primary">KES {balance.toLocaleString()}</div>
          <div className="text-[9px] text-muted-foreground">Balance</div>
        </div>
      </div>

      {/* Withdraw / Subscribe */}
      <div className="flex gap-2">
        <Button onClick={() => setShowWithdrawDialog(true)} disabled={!canWithdraw} size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
          <Wallet className="h-3.5 w-3.5 mr-1" /> Withdraw
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setShowSubscriptions(true)}>
          <CreditCard className="h-3.5 w-3.5 mr-1" /> Subscribe
        </Button>
      </div>

      {/* XP bar */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className={`font-bold ${rank.color}`}>{rank.label}</span>
          <span className="text-muted-foreground">{rank.nextRank}</span>
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
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" /> Security
        </h2>
        <div className="flex items-center justify-between text-xs">
          <span>Email verified</span>
          <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> {user?.email}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Phone</span>
          <span className={phone ? "text-success font-semibold" : "text-muted-foreground"}>{phone || "Not set"}</span>
        </div>
      </div>

      {/* Plan */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Plan</span>
          <span className={`text-xs font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
        </div>
        <ul className="space-y-1 mb-3">
          <li className="text-[10px] text-muted-foreground">• {sub.limits.dailyAnswers === 999 ? "Unlimited" : sub.limits.dailyAnswers} answers/day</li>
          <li className="text-[10px] text-muted-foreground">• {sub.limits.platformFee}% fee</li>
        </ul>
        <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={() => setShowSubscriptions(!showSubscriptions)}>
          {showSubscriptions ? "Hide Plans" : "Manage Subscription →"}
        </Button>
      </div>

      {/* Subscription plans (expandable) */}
      {showSubscriptions && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-primary" /> Plans
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {SUB_TIERS.map((tier) => {
              const isCurrent = currentPlan === tier.dbValue;
              return (
                <div key={tier.id} className={`glass-card rounded-xl p-3 flex flex-col relative ${tier.id === "gold" ? "border-primary/40" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
                  {tier.id === "gold" && <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</div>}
                  <div className="text-center mb-2">
                    <div className="text-lg mb-0.5">{tier.icon}</div>
                    <div className={`text-xs font-bold ${tier.color}`}>{tier.name}</div>
                    <span className="text-base font-bold font-mono">{tier.price === 0 ? "Free" : `${tier.price}`}</span>
                    {tier.period && <span className="text-[9px] text-muted-foreground">{tier.period}</span>}
                  </div>
                  <ul className="space-y-1 flex-1 mb-3">
                    {tier.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                        <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" /><span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => handleSubscribe(tier.id)} disabled={isCurrent || tier.id === "free"} size="sm" className={`w-full text-[10px] h-7 ${tier.id === "gold" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {isCurrent ? "Current" : tier.id === "free" ? "Free" : "Subscribe"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    <div className={`text-xs font-bold ${r.color}`}>{r.animal} {r.label}</div>
                    <div className="text-[9px] text-muted-foreground">{r.cpRequired}+ CP</div>
                  </div>
                  {isCurrent && <span className="text-[9px] font-bold text-primary">YOU</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          Theme
        </div>
        <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs font-medium hover:bg-secondary transition-colors">
          {theme === "dark" ? <><Sun className="h-3.5 w-3.5" /> Light Mode</> : <><Moon className="h-3.5 w-3.5" /> Dark Mode</>}
        </button>
      </div>

      {/* Sign out */}
      <Button onClick={signOut} variant="outline" size="sm" className="w-full text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
        <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      {avatarInput}
      <DesktopLayout />
      <MobileLayout />

      {/* Withdraw dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Withdraw via M-Pesa</DialogTitle>
            <DialogDescription className="text-xs">Full balance sent to your M-Pesa number</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-center text-xl font-bold font-mono text-primary">KES {balance.toFixed(0)}</div>
            <div className="text-center text-[11px] text-muted-foreground">
              To: <span className="font-mono font-bold text-foreground">{profile?.phone_number || "No phone"}</span>
            </div>
            {!profile?.phone_number && <p className="text-[10px] text-destructive text-center">Add M-Pesa number in your profile first</p>}
          </div>
          <Button onClick={handleWithdraw} disabled={withdrawing || !profile?.phone_number || balance < 500} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
            {withdrawing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Confirm Withdrawal
          </Button>
        </DialogContent>
      </Dialog>

      {/* Payment method dialog */}
      <Dialog open={selectedPlan !== null && paymentMethod === null && selectedPlan !== "free"} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Payment Method</DialogTitle>
            <DialogDescription className="text-xs">Choose how to pay</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <button onClick={() => setPaymentMethod("paystack")} className="glass-card rounded-lg p-3 flex items-center gap-3 text-left text-sm hover:bg-muted/10 transition-colors">
              <CreditCard className="h-5 w-5 text-primary" />
              <div><div className="font-bold text-xs">Card (Paystack)</div><div className="text-[10px] text-muted-foreground">Visa, Mastercard</div></div>
            </button>
            <button onClick={() => setPaymentMethod("mpesa")} className="glass-card rounded-lg p-3 flex items-center gap-3 text-left text-sm hover:bg-muted/10 transition-colors">
              <Smartphone className="h-5 w-5 text-primary" />
              <div><div className="font-bold text-xs">M-Pesa</div><div className="text-[10px] text-muted-foreground">STK Push</div></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paystack confirm */}
      <Dialog open={paymentMethod === "paystack"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Pay with Card</DialogTitle></DialogHeader>
          <div className="py-2 text-center">
            <div className="text-xl font-bold font-mono text-primary">KES {SUB_TIERS.find((t) => t.id === selectedPlan)?.price.toLocaleString()}</div>
          </div>
          <Button onClick={processPaystack} disabled={subscribing} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-9">
            {subscribing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Proceed
          </Button>
        </DialogContent>
      </Dialog>

      {/* M-Pesa dialog */}
      <Dialog open={paymentMethod === "mpesa"} onOpenChange={() => setPaymentMethod(null)}>
        <DialogContent className="glass-card border-border/60 max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">M-Pesa Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-center text-xl font-bold font-mono text-primary">KES {SUB_TIERS.find((t) => t.id === selectedPlan)?.price.toLocaleString()}</div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="254712345678" className="h-8 text-xs bg-secondary/30 border-border/40" />
            </div>
          </div>
          <Button onClick={processMpesa} disabled={subscribing || !mpesaPhone} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-9">
            {subscribing && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Send STK Push
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Profile;
