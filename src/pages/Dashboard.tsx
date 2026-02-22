import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, MessageSquareText, Coins, Flame, Loader2, Wallet, Crown, Zap, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRankConfig, getRankProgress, getSubTier } from "@/lib/ranks";
import { toast } from "sonner";

const STREAK_BONUSES = [
  { day: 1, cp: 5, label: "Day 1" },
  { day: 3, cp: 10, label: "3-Day" },
  { day: 7, cp: 25, label: "Week" },
  { day: 14, cp: 50, label: "2 Weeks" },
  { day: 30, cp: 100, label: "Month" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadAll = async () => {
      const [profileRes, streakRes, qCountRes, aCountRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("answers").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      ]);

      setProfile(profileRes.data);
      setQuestionCount(qCountRes.count || 0);
      setAnswerCount(aCountRes.count || 0);

      const today = new Date().toISOString().split("T")[0];

      if (!streakRes.data) {
        const { data: newStreak } = await supabase
          .from("user_streaks")
          .insert({ user_id: user.id, current_streak: 1, longest_streak: 1, last_login_date: today, total_logins: 1, bonus_claimed_today: false })
          .select().single();
        setStreak(newStreak);
      } else {
        const lastLogin = streakRes.data.last_login_date;
        if (lastLogin !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          const isConsecutive = lastLogin === yesterdayStr;
          const newStreak = isConsecutive ? (streakRes.data.current_streak || 0) + 1 : 1;
          const longestStreak = Math.max(newStreak, streakRes.data.longest_streak || 0);
          const { data: updated } = await supabase
            .from("user_streaks")
            .update({ current_streak: newStreak, longest_streak: longestStreak, last_login_date: today, total_logins: (streakRes.data.total_logins || 0) + 1, bonus_claimed_today: false })
            .eq("user_id", user.id).select().single();
          setStreak(updated);
        } else {
          setStreak(streakRes.data);
        }
      }
      setLoading(false);
    };
    loadAll();
  }, [user]);

  const claimDailyBonus = async () => {
    if (!user || !streak || streak.bonus_claimed_today) return;
    setClaimingBonus(true);
    const currentDay = streak.current_streak || 1;
    let bonusCP = 5;
    for (const bonus of STREAK_BONUSES) { if (currentDay >= bonus.day) bonusCP = bonus.cp; }
    const [, streakUpdate] = await Promise.all([
      supabase.from("profiles").update({ cp_balance: (profile?.cp_balance || 0) + bonusCP }).eq("user_id", user.id),
      supabase.from("user_streaks").update({ bonus_claimed_today: true }).eq("user_id", user.id).select().single(),
    ]);
    setStreak(streakUpdate.data);
    setProfile((prev: any) => ({ ...prev, cp_balance: (prev?.cp_balance || 0) + bonusCP }));
    toast.success(`+${bonusCP} CP daily bonus claimed! 🔥`);
    setClaimingBonus(false);
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
  const currentStreak = streak?.current_streak || 0;
  const bonusClaimed = streak?.bonus_claimed_today || false;

  let todayBonus = 5;
  for (const bonus of STREAK_BONUSES) { if (currentStreak >= bonus.day) todayBonus = bonus.cp; }

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6 animate-fade-in">
        {/* Welcome header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg lg:text-2xl font-bold tracking-tight">
              Welcome, <span className="text-gradient-gold">{profile?.display_name || "Solver"}</span>
            </h1>
            <p className="text-[11px] lg:text-sm text-muted-foreground">Your Soluny command center</p>
          </div>
          <Link to="/dashboard/questions/new">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 lg:h-10 text-xs lg:text-sm px-3 lg:px-4">
              <Flame className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-1" /> Post
            </Button>
          </Link>
        </div>

        {/* Desktop: 2 column layout for streak + rank */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Streak + Daily bonus */}
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
            <div className="flex flex-col items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-primary/10 border border-primary/20">
              <Flame className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              <span className="text-[10px] lg:text-xs font-mono font-bold text-primary">{currentStreak}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs lg:text-sm font-bold">
                {currentStreak > 0 ? `${currentStreak}-day streak!` : "Start your streak!"}
              </div>
              <div className="text-[10px] lg:text-xs text-muted-foreground">
                {bonusClaimed ? "Bonus claimed today ✓" : `Claim +${todayBonus} CP daily bonus`}
              </div>
            </div>
            {!bonusClaimed && (
              <Button onClick={claimDailyBonus} size="sm" disabled={claimingBonus} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 lg:h-10 text-xs lg:text-sm px-3 shrink-0">
                {claimingBonus ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Zap className="h-3 w-3 lg:h-4 lg:w-4 mr-1" /> Claim</>}
              </Button>
            )}
          </div>

          {/* Rank card */}
          <div className="glass-card rounded-xl lg:rounded-2xl p-4 lg:p-5 flex items-center gap-4">
            <img src={rank.image} alt={rank.label} className="h-16 w-16 lg:h-20 lg:w-20 rounded-xl lg:rounded-2xl object-cover border-2 border-border/40" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm lg:text-base font-bold ${rank.color}`}>{rank.animal} {rank.label}</span>
                <span className="text-[9px] lg:text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{cp} CP</span>
              </div>
              <div className="h-2 lg:h-2.5 rounded-full bg-secondary/50 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${cpProgress}%` }} />
              </div>
              <div className="flex justify-between mt-0.5 text-[9px] lg:text-[10px] text-muted-foreground">
                <span>{rank.label}</span>
                <span>{rank.nextRank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-4">
          {[
            { label: "Balance", value: `KES ${Number(profile?.available_balance_kes || 0).toLocaleString()}`, icon: Wallet },
            { label: "Earned", value: `KES ${Number(profile?.total_earnings_kes || 0).toLocaleString()}`, icon: Coins },
            { label: "Questions", value: questionCount.toString(), icon: MessageSquareText },
            { label: "Answers", value: answerCount.toString(), icon: TrendingUp },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 space-y-1 lg:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
              </div>
              <div className="text-sm lg:text-xl font-bold font-mono">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Plan + Streak milestones */}
        <div className="grid sm:grid-cols-2 gap-2 lg:gap-4">
          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <Crown className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Plan</span>
            </div>
            <div className="text-sm lg:text-base font-bold mb-1">{sub.icon} {sub.name}</div>
            <div className="grid grid-cols-2 gap-1.5 lg:gap-2 text-[10px] lg:text-xs">
              <div className="bg-secondary/30 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 text-center">
                <div className="font-mono font-bold">{sub.limits.dailyAnswers >= 999 ? "∞" : sub.limits.dailyAnswers}</div>
                <div className="text-muted-foreground">Answers/day</div>
              </div>
              <div className="bg-secondary/30 rounded-lg px-2 py-1.5 lg:px-3 lg:py-2 text-center">
                <div className="font-mono font-bold">{sub.limits.platformFee}%</div>
                <div className="text-muted-foreground">Fee</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground">Streak Bonuses</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 overflow-x-auto pb-1">
              {STREAK_BONUSES.map((b) => {
                const reached = currentStreak >= b.day;
                return (
                  <div key={b.day} className={`flex flex-col items-center gap-0.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg min-w-[48px] lg:min-w-[60px] text-[9px] lg:text-[10px] ${
                    reached ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
                  }`}>
                    <span className={`font-bold ${reached ? "text-primary" : "text-muted-foreground"}`}>{b.label}</span>
                    <span className={`font-mono ${reached ? "text-foreground" : "text-muted-foreground"}`}>+{b.cp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          <Link to="/dashboard/questions" className="glass-card glass-card-hover rounded-xl lg:rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
            <MessageSquareText className="h-5 w-5 lg:h-6 lg:w-6 text-info shrink-0" />
            <div>
              <div className="text-xs lg:text-sm font-bold">Questions</div>
              <div className="text-[10px] lg:text-xs text-muted-foreground">Solve & earn</div>
            </div>
          </Link>
          <Link to="/dashboard/leaderboard" className="glass-card glass-card-hover rounded-xl lg:rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
            <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-primary shrink-0" />
            <div>
              <div className="text-xs lg:text-sm font-bold">Leaderboard</div>
              <div className="text-[10px] lg:text-xs text-muted-foreground">Your ranking</div>
            </div>
          </Link>
        </div>

        {/* Rank progression */}
        <div className="glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5">
          <div className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 lg:mb-3">Rank Progression</div>
          <div className="flex items-center justify-between gap-1 lg:gap-3 overflow-x-auto pb-1">
            {["newcomer", "contributor", "analyst", "scholar", "sage", "grand_master"].map((key) => {
              const r = getRankConfig(key);
              const isActive = key === (profile?.rank || "newcomer");
              return (
                <div key={key} className={`flex flex-col items-center gap-1 px-1.5 lg:px-3 py-1 lg:py-2 rounded-lg min-w-[52px] lg:min-w-[80px] ${isActive ? "bg-primary/10 border border-primary/30" : ""}`}>
                  <img src={r.image} alt={r.label} className={`h-8 w-8 lg:h-12 lg:w-12 rounded-lg object-cover ${isActive ? "" : "opacity-40 grayscale"}`} />
                  <span className={`text-[8px] lg:text-[10px] font-bold ${isActive ? r.color : "text-muted-foreground"}`}>{r.label}</span>
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
