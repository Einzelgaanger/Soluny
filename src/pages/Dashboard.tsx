import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, MessageSquareText, Coins, ArrowUpRight, Flame, Loader2, Wallet, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRankConfig, getRankProgress, getSubTier } from "@/lib/ranks";

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
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const rank = getRankConfig(profile?.rank || "newcomer");
  const cp = profile?.cp_balance || 0;
  const cpProgress = getRankProgress(profile?.rank || "newcomer", cp);
  const sub = getSubTier(profile?.subscription_plan || "free");

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Welcome header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Welcome, <span className="text-gradient-gold">{profile?.display_name || "Solver"}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Your Soluny command center</p>
          </div>
          <Link to="/dashboard/questions/new">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 text-xs px-3">
              <Flame className="h-3.5 w-3.5 mr-1" /> Post
            </Button>
          </Link>
        </div>

        {/* Rank card with animal image */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <img src={rank.image} alt={rank.label} className="h-16 w-16 rounded-xl object-cover border-2 border-border/40" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold ${rank.color}`}>{rank.animal} {rank.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{cp} CP</span>
            </div>
            {/* XP bar */}
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${cpProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] text-muted-foreground">
              <span>{rank.label}</span>
              <span>{rank.nextRank}</span>
            </div>
          </div>
        </div>

        {/* Stats grid - compact */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Balance", value: `KES ${Number(profile?.available_balance_kes || 0).toLocaleString()}`, icon: Wallet, glow: "" },
            { label: "Earned", value: `KES ${Number(profile?.total_earnings_kes || 0).toLocaleString()}`, icon: Coins, glow: "glow-variant-success" },
            { label: "Plan", value: `${sub.icon} ${sub.name}`, icon: Crown, glow: "glow-variant-info" },
          ].map((s) => (
            <div key={s.label} className={`glass-card stat-card-glow ${s.glow} rounded-xl p-3 space-y-1`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-sm font-bold font-mono">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Subscription limits info */}
        <div className="glass-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Limits</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">{sub.limits.dailyAnswers}</div>
              <div className="text-muted-foreground">Answers/day</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">{sub.limits.platformFee}%</div>
              <div className="text-muted-foreground">Platform fee</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">KES {sub.limits.maxWithdrawal.toLocaleString()}</div>
              <div className="text-muted-foreground">Max withdraw</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="font-mono font-bold">{sub.limits.questionsPerMonth >= 999 ? "∞" : sub.limits.questionsPerMonth}</div>
              <div className="text-muted-foreground">Questions/mo</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/dashboard/questions" className="glass-card glass-card-hover rounded-xl p-3 flex items-center gap-3">
            <MessageSquareText className="h-5 w-5 text-info shrink-0" />
            <div>
              <div className="text-xs font-bold">Questions</div>
              <div className="text-[10px] text-muted-foreground">Solve & earn</div>
            </div>
          </Link>
          <Link to="/dashboard/leaderboard" className="glass-card glass-card-hover rounded-xl p-3 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-xs font-bold">Leaderboard</div>
              <div className="text-[10px] text-muted-foreground">Your ranking</div>
            </div>
          </Link>
        </div>

        {/* Rank progression preview */}
        <div className="glass-card rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Rank Progression</div>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {["newcomer", "contributor", "analyst", "scholar", "sage", "grand_master"].map((key) => {
              const r = getRankConfig(key);
              const isActive = key === (profile?.rank || "newcomer");
              return (
                <div key={key} className={`flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg min-w-[52px] ${isActive ? "bg-primary/10 border border-primary/30" : ""}`}>
                  <img src={r.image} alt={r.label} className={`h-8 w-8 rounded-lg object-cover ${isActive ? "" : "opacity-40 grayscale"}`} />
                  <span className={`text-[8px] font-bold ${isActive ? r.color : "text-muted-foreground"}`}>{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
