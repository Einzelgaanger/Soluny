import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, ArrowUpRight, Banknote, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Earnings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("available_balance_kes, total_earnings_kes, phone_number").eq("user_id", user.id).single(),
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
      // Refresh
      const { data: p } = await supabase.from("profiles").select("available_balance_kes, total_earnings_kes, phone_number").eq("user_id", user!.id).single();
      if (p) setProfile(p);
      const { data: e } = await supabase.from("earnings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      if (e) setEarnings(e);
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const balance = Number(profile?.available_balance_kes || 0);
  const totalEarned = Number(profile?.total_earnings_kes || 0);
  const pendingPayouts = earnings.filter(
    (e) => e.payout_status === "pending" || e.payout_status === "processing"
  ).reduce((sum, e) => sum + Number(e.amount_kes), 0);

  const statusColors: Record<string, string> = {
    pending: "text-warning",
    processing: "text-info",
    completed: "text-success",
    failed: "text-destructive",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your earnings and request withdrawals</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass-card stat-card-glow rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Balance</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono text-gold-glow">KES {balance.toFixed(2)}</div>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs"
              disabled={balance < 500}
              onClick={() => setShowWithdrawDialog(true)}
            >
              Withdraw via M-Pesa
            </Button>
          </div>
          <div className="glass-card stat-card-glow glow-variant-success rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Earned</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono">KES {totalEarned.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs text-success font-semibold">
              <ArrowUpRight className="h-3 w-3" /> Lifetime
            </div>
          </div>
          <div className="glass-card stat-card-glow glow-variant-info rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Payouts</span>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono">KES {pendingPayouts.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Min withdrawal: KES 500</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold tracking-tight mb-4">Transaction History</h2>
          {earnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet. Start earning by answering questions!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Amount</th>
                    <th className="text-left py-2 font-medium">Method</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">M-Pesa Code</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e) => (
                    <tr key={e.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="py-3 font-mono text-xs">
                        {new Date(e.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-mono font-bold">KES {Number(e.amount_kes).toFixed(2)}</td>
                      <td className="py-3 text-xs capitalize">{e.payout_method || "Earned"}</td>
                      <td className={`py-3 text-xs font-semibold capitalize ${statusColors[e.payout_status] || ""}`}>
                        {e.payout_status}
                      </td>
                      <td className="py-3 font-mono text-xs">{e.mpesa_code || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="glass-card border-border/60">
          <DialogHeader>
            <DialogTitle>Withdraw via M-Pesa</DialogTitle>
            <DialogDescription>
              Your full balance will be sent to your M-Pesa number
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="glass-card rounded-xl p-4 text-center space-y-2">
              <div className="text-sm text-muted-foreground">Withdrawal Amount</div>
              <div className="text-3xl font-bold font-mono text-gold-glow">
                KES {balance.toFixed(2)}
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Sending to: <span className="font-mono font-bold text-foreground">{profile?.phone_number || "No phone set"}</span>
            </div>
            {!profile?.phone_number && (
              <p className="text-xs text-destructive text-center">
                Please add your M-Pesa number in your Profile first.
              </p>
            )}
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={withdrawing || !profile?.phone_number || balance < 500}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirm Withdrawal
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Earnings;
