import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, Loader2, Banknote, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSubTier } from "@/lib/ranks";

const Earnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("available_balance_kes, total_earnings_kes, phone_number, subscription_plan, subscription_expires_at").eq("user_id", user.id).single(),
      supabase.from("earnings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(([profileRes, earningsRes]) => {
      if (profileRes.data) setProfile(profileRes.data);
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

        {/* Stats */}
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

        {/* Current Plan */}
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
          <Button variant="outline" size="sm" className="w-full lg:w-auto h-8 lg:h-9 text-xs lg:text-sm" onClick={() => navigate("/dashboard/subscribe")}>
            Upgrade Plan →
          </Button>
        </div>

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
    </DashboardLayout>
  );
};

export default Earnings;
