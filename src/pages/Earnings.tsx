import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Wallet, ArrowUpRight, Banknote, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Earnings = () => {
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
            <div className="text-3xl font-bold font-mono text-gold-glow">KES 0.00</div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs">
              Withdraw via M-Pesa
            </Button>
          </div>
          <div className="glass-card stat-card-glow glow-variant-success rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Earned</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono">KES 0.00</div>
            <div className="flex items-center gap-1 text-xs text-success font-semibold">
              <ArrowUpRight className="h-3 w-3" /> Lifetime
            </div>
          </div>
          <div className="glass-card stat-card-glow glow-variant-info rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Payouts</span>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold font-mono">KES 0.00</div>
            <div className="text-xs text-muted-foreground">Min withdrawal: KES 500</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold tracking-tight mb-4">Transaction History</h2>
          <div className="text-center py-12 text-muted-foreground">
            <Banknote className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions yet. Start earning by answering questions!</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Earnings;
