import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, Loader2, Banknote, Crown, CreditCard, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSubTier, SUB_TIERS } from "@/lib/ranks";

const Earnings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Subscription
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "mpesa" | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("available_balance_kes, total_earnings_kes, phone_number, subscription_plan, subscription_expires_at").eq("user_id", user.id).single(),
      supabase.from("earnings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(([profileRes, earningsRes]) => {
      if (profileRes.data) {
        setProfile(profileRes.data);
        setMpesaPhone(profileRes.data.phone_number || "");
      }
      if (earningsRes.data) setEarnings(earningsRes.data);
      setLoading(false);
    });
  }, [user]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const { data, error } = await supabase.functions.invoke("mpesa-b2c-payout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Withdrawal of KES ${data.amount} initiated!`);
      setShowWithdrawDialog(false);
      const { data: p } = await supabase.from("profiles").select("available_balance_kes, total_earnings_kes, phone_number, subscription_plan, subscription_expires_at").eq("user_id", user!.id).single();
      if (p) setProfile(p);
    } catch (err: any) { toast.error(err.message || "Withdrawal failed"); }
    finally { setWithdrawing(false); }
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
        body: { amount: tier.price, plan: tier.dbValue, callback_url: window.location.origin + "/dashboard/earnings" },
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const balance = Number(profile?.available_balance_kes || 0);
  const totalEarned = Number(profile?.total_earnings_kes || 0);
  const sub = getSubTier(profile?.subscription_plan || "free");
  const canWithdraw = balance >= 500 && balance <= sub.limits.maxWithdrawal;
  const currentPlan = profile?.subscription_plan || "free";

  const statusColors: Record<string, string> = {
    pending: "text-warning",
    processing: "text-info",
    completed: "text-success",
    failed: "text-destructive",
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6 animate-fade-in">
        <h1 className="text-lg lg:text-2xl font-bold tracking-tight">Earnings</h1>

        {/* Stats — responsive grid */}
        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 space-y-1 lg:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground">Balance</span>
              <Wallet className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </div>
            <div className="text-sm lg:text-xl font-bold font-mono text-primary">KES {balance.toFixed(0)}</div>
            <Button
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-[9px] lg:text-xs h-6 lg:h-9"
              disabled={!canWithdraw}
              onClick={() => setShowWithdrawDialog(true)}
            >
              Withdraw
            </Button>
          </div>
          <div className="glass-card stat-card-glow glow-variant-success rounded-xl lg:rounded-2xl p-3 lg:p-5 space-y-1 lg:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Earned</span>
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </div>
            <div className="text-sm lg:text-xl font-bold font-mono">KES {totalEarned.toFixed(0)}</div>
          </div>
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 space-y-1 lg:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Withdraw</span>
              <Banknote className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </div>
            <div className="text-sm lg:text-xl font-bold font-mono">KES {sub.limits.maxWithdrawal.toLocaleString()}</div>
            <div className="text-[9px] lg:text-xs text-muted-foreground">{sub.icon} {sub.name} tier</div>
          </div>
        </div>

        {/* Current Plan + Manage Subscription */}
        <div className="glass-card rounded-xl lg:rounded-2xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
              <span className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground">Subscription</span>
            </div>
            <span className={`text-xs lg:text-sm font-bold ${sub.color}`}>{sub.icon} {sub.name}</span>
          </div>
          {currentPlan !== "free" && profile?.subscription_expires_at && (
            <div className="text-[10px] lg:text-xs text-muted-foreground mb-3">
              Expires {new Date(profile.subscription_expires_at).toLocaleDateString()}
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            <div className="bg-secondary/30 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 text-center">
              <div className="font-mono font-bold text-xs lg:text-sm">{sub.limits.dailyAnswers >= 999 ? "∞" : sub.limits.dailyAnswers}</div>
              <div className="text-[9px] lg:text-[10px] text-muted-foreground">Answers/day</div>
            </div>
            <div className="bg-secondary/30 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 text-center">
              <div className="font-mono font-bold text-xs lg:text-sm">{sub.limits.platformFee}%</div>
              <div className="text-[9px] lg:text-[10px] text-muted-foreground">Fee</div>
            </div>
            <div className="bg-secondary/30 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 text-center">
              <div className="font-mono font-bold text-xs lg:text-sm">{sub.limits.questionsPerMonth >= 999 ? "∞" : sub.limits.questionsPerMonth}</div>
              <div className="text-[9px] lg:text-[10px] text-muted-foreground">Questions/mo</div>
            </div>
            <div className="bg-secondary/30 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 text-center">
              <div className="font-mono font-bold text-xs lg:text-sm">KES {sub.limits.maxWithdrawal >= 999999 ? "∞" : sub.limits.maxWithdrawal.toLocaleString()}</div>
              <div className="text-[9px] lg:text-[10px] text-muted-foreground">Max Withdraw</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full lg:w-auto h-8 lg:h-9 text-xs lg:text-sm" onClick={() => setShowSubscriptions(!showSubscriptions)}>
            {showSubscriptions ? "Hide Plans" : "Upgrade Plan →"}
          </Button>
        </div>

        {/* Subscription plans */}
        {showSubscriptions && (
          <div className="glass-card rounded-xl lg:rounded-2xl p-4 lg:p-6 space-y-4">
            <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground">Choose a Plan</h2>
            {/* Mobile: 2 cols, Desktop: 5 cols */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4">
              {SUB_TIERS.map((tier) => {
                const isCurrent = currentPlan === tier.dbValue;
                return (
                  <div key={tier.id} className={`glass-card rounded-xl p-3 lg:p-4 flex flex-col relative ${tier.id === "gold" ? "border-primary/40" : ""} ${isCurrent ? "ring-1 ring-primary/50" : ""}`}>
                    {tier.id === "gold" && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</div>
                    )}
                    <div className="text-center mb-2 lg:mb-3">
                      <div className="text-lg lg:text-2xl mb-0.5">{tier.icon}</div>
                      <div className={`text-xs lg:text-sm font-bold ${tier.color}`}>{tier.name}</div>
                      <div className="mt-1">
                        <span className="text-base lg:text-xl font-bold font-mono">{tier.price === 0 ? "Free" : `${tier.price}`}</span>
                        {tier.period && <span className="text-[9px] lg:text-xs text-muted-foreground">{tier.period}</span>}
                      </div>
                    </div>
                    <ul className="space-y-1 flex-1 mb-3">
                      {tier.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-1 text-[10px] lg:text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" /><span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => handleSubscribe(tier.id)} disabled={isCurrent || tier.id === "free"} size="sm" className={`w-full text-[10px] lg:text-xs h-7 lg:h-9 ${tier.id === "gold" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {isCurrent ? "Current" : tier.id === "free" ? "Free" : "Subscribe"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div>
          <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 lg:mb-3">Transactions</h2>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Banknote className="h-6 w-6 mx-auto mb-1 opacity-30" />
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 lg:py-3 px-1 lg:px-3 hover:bg-muted/5 rounded-lg transition-colors">
                  <div>
                    <div className="text-xs lg:text-sm font-medium">{e.payout_method ? "Withdrawal" : "Earning"}</div>
                    <div className="text-[10px] lg:text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs lg:text-sm font-mono font-bold">{e.payout_method ? "-" : "+"}KES {Number(e.amount_kes).toFixed(0)}</div>
                    <div className={`text-[9px] lg:text-[10px] font-semibold capitalize ${statusColors[e.payout_status] || ""}`}>{e.payout_status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            {!profile?.phone_number && (
              <p className="text-[10px] text-destructive text-center">Add M-Pesa number in Profile first</p>
            )}
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

export default Earnings;
