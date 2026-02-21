import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, MessageSquareText, Coins, Award, ArrowUpRight, Flame, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const rankConfig: Record<string, { color: string; next: string; cpNeeded: number }> = {
  newcomer: { color: "text-muted-foreground", next: "Contributor", cpNeeded: 100 },
  contributor: { color: "text-info", next: "Analyst", cpNeeded: 500 },
  analyst: { color: "text-success", next: "Scholar", cpNeeded: 1500 },
  scholar: { color: "text-primary", next: "Sage", cpNeeded: 5000 },
  sage: { color: "text-warning", next: "Grand Master", cpNeeded: 15000 },
  grand_master: { color: "text-primary", next: "MAX", cpNeeded: 99999 },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const rank = profile?.rank || "newcomer";
  const cp = profile?.cp_balance || 0;
  const config = rankConfig[rank] || rankConfig.newcomer;
  const cpProgress = Math.min((cp / config.cpNeeded) * 100, 100);

  const stats = [
    {
      label: "Total Earnings",
      value: `KES ${Number(profile?.total_earnings_kes || 0).toLocaleString()}`,
      icon: Coins,
      glow: "",
    },
    {
      label: "CP Balance",
      value: `${cp} CP`,
      icon: Award,
      glow: "glow-variant-info",
    },
    {
      label: "Available",
      value: `KES ${Number(profile?.available_balance_kes || 0).toLocaleString()}`,
      icon: TrendingUp,
      glow: "glow-variant-success",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, <span className="text-gradient-gold">{profile?.display_name || user?.user_metadata?.display_name || "Solver"}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Here's your Soluny overview</p>
          </div>
          <Link to="/dashboard/questions/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl">
              <Flame className="h-4 w-4 mr-2" /> Post Challenge
            </Button>
          </Link>
        </div>

        {/* Rank progress card */}
        <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Award className={`h-6 w-6 ${config.color}`} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Rank</div>
                <div className={`text-lg font-bold capitalize ${config.color}`}>{rank.replace("_", " ")}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Next: {config.next}</div>
              <div className="text-sm font-mono font-bold">{cp}/{config.cpNeeded} CP</div>
            </div>
          </div>
          {/* XP bar */}
          <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
              style={{ width: `${cpProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>{rank.replace("_", " ")}</span>
            <span>{config.next}</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`glass-card glass-card-hover stat-card-glow ${s.glow} rounded-2xl p-4 sm:p-5 space-y-2 sm:space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-xl sm:text-3xl font-bold font-mono tracking-tight">{s.value}</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-success">
                <ArrowUpRight className="h-3 w-3" />
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/dashboard/questions" className="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-info/10 border border-info/20">
              <MessageSquareText className="h-6 w-6 text-info" />
            </div>
            <div>
              <div className="font-bold">Browse Questions</div>
              <div className="text-sm text-muted-foreground">Find challenges to solve and earn</div>
            </div>
          </Link>
          <Link to="/dashboard/leaderboard" className="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-bold">Leaderboard</div>
              <div className="text-sm text-muted-foreground">See where you rank this month</div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
