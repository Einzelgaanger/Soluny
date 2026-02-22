import { useState, useEffect } from "react";
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
  CreditCard, Smartphone, Wallet, ChevronDown, ChevronUp, Shield,
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

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-4 animate-fade-in pb-8">
        <h1 className="text-lg font-bold tracking-tight">My Profile</h1>

        {/* Avatar & rank */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-xl bg-secondary border border-border/40 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 h-5 w-5 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="h-3 w-3" />
            </button>
          </div>
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

        {/* Stats + Wallet */}
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

        {/* Withdraw / Top Up */}
        <div className="flex gap-2">
          <Button onClick={() => setShowWithdrawDialog(true)} disabled={!canWithdraw} size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
            <Wallet className="h-3.5 w-3.5 mr-1" /> Withdraw
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => { setShowSubscriptions(true); }}>
            <CreditCard className="h-3.5 w-3.5 mr-1" /> Top Up / Subscribe
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

        {/* Security info */}
        <div className="glass-card rounded-xl p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Security
          </h2>
          <div className="flex items-center justify-between text-xs">
            <span>Email verified</span>
            <span className="text-success font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> {user?.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Phone number</span>
            <span className={phone ? "text-success font-semibold" : "text-muted-foreground"}>{phone || "Not set"}</span>
          </div>
        </div>

        {/* Subscription summary */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Plan</span>
            <span className={`text-xs font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
          </div>
          {currentPlan !== "free" && profile?.subscription_expires_at && (
            <div className="text-[10px] text-muted-foreground mb-2">
              Expires {new Date(profile.subscription_expires_at).toLocaleDateString()}
            </div>
          )}
          <ul className="space-y-1 mb-3">
            <li className="text-[10px] text-muted-foreground">• {sub.limits.dailyAnswers === 999 ? "Unlimited" : sub.limits.dailyAnswers} answers/day</li>
            <li className="text-[10px] text-muted-foreground">• {sub.limits.questionsPerMonth === 999 ? "Unlimited" : sub.limits.questionsPerMonth} questions/month</li>
            <li className="text-[10px] text-muted-foreground">• {sub.limits.platformFee}% platform fee</li>
            <li className="text-[10px] text-muted-foreground">• KES {sub.limits.maxWithdrawal === 999999 ? "Unlimited" : sub.limits.maxWithdrawal.toLocaleString()} max withdrawal</li>
          </ul>
          <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={() => setShowSubscriptions(!showSubscriptions)}>
            {showSubscriptions ? "Hide Plans" : "Manage Subscription →"}
          </Button>
        </div>

        {/* Subscription plans (expandable) */}
        {showSubscriptions && (
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-primary" /> Subscription Plans
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUB_TIERS.map((tier) => {
                const isCurrent = currentPlan === tier.dbValue;
                return (
                  <div key={tier.id} className={`glass-card rounded-xl p-3 flex flex-col relative ${tier.id === "gold" ? "border-primary/40" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
                    {tier.id === "gold" && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</div>
                    )}
                    <div className="text-center mb-2">
                      <div className="text-lg mb-0.5">{tier.icon}</div>
                      <div className={`text-xs font-bold ${tier.color}`}>{tier.name}</div>
                      <div className="mt-1">
                        <span className="text-base font-bold font-mono">{tier.price === 0 ? "Free" : `${tier.price}`}</span>
                        {tier.period && <span className="text-[9px] text-muted-foreground">{tier.period}</span>}
                      </div>
                    </div>
                    <ul className="space-y-1 flex-1 mb-3">
                      {tier.features.map((f) => (
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
            <div className="text-xs text-muted-foreground">
              <p className="font-bold text-foreground mb-1">How the Platform Fee Works</p>
              <p>When a question's voting period ends, Soluny takes a small platform fee from the prize pool before distributing earnings. Higher tiers = lower fees.</p>
            </div>
          </div>
        )}

        {/* Ranks section */}
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
                      <div className="text-[9px] text-muted-foreground">{r.cpRequired}+ CP • {r.perks.join(" • ")}</div>
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
            {!profile?.phone_number && <p className="text-[10px] text-destructive text-center">Add M-Pesa number above first</p>}
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
