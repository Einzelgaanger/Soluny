import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Loader2, Flame } from "lucide-react";
import leaderboardHero from "@/assets/leaderboard-hero.jpg";

const rankColors: Record<string, string> = {
  grand_master: "text-primary",
  sage: "text-warning",
  scholar: "text-primary",
  analyst: "text-success",
  contributor: "text-info",
  newcomer: "text-muted-foreground",
};

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, cp_balance, rank, avatar_url")
      .order("cp_balance", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        setLeaders(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Hero banner */}
        <div className="relative rounded-2xl overflow-hidden h-32 sm:h-40">
          <img src={leaderboardHero} alt="Leaderboard" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/30" />
          <div className="relative z-10 flex items-center h-full px-5 sm:px-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Flame className="h-6 w-6 text-primary" /> Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Top contributors by Contribution Points</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : leaders.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Leaderboard populates as the community grows</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[60px_1fr_100px_120px] gap-4 px-5 py-3 border-b border-border/40">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Rank</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solver</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">CP</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">Tier</span>
            </div>
            {leaders.map((l, i) => (
              <div
                key={i}
                className={`flex sm:grid sm:grid-cols-[60px_1fr_100px_120px] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 border-b border-border/20 hover:bg-muted/10 transition-colors ${
                  i < 3 ? "bg-primary/[0.02]" : ""
                }`}
              >
                <div className="flex items-center shrink-0">
                  {i === 0 ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary/40">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                  ) : i === 1 ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border/40">
                      <Medal className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : i === 2 ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border/40">
                      <Award className="h-4 w-4 text-muted-foreground/70" />
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground w-8 text-center">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{l.display_name || "Anonymous"}</span>
                  <span className={`text-[10px] capitalize sm:hidden ${rankColors[l.rank] || ""}`}>{(l.rank || "newcomer").replace("_", " ")}</span>
                </div>
                <span className="text-sm font-mono font-bold text-right shrink-0">{l.cp_balance}</span>
                <span className={`hidden sm:block text-xs text-right capitalize ${rankColors[l.rank] || ""}`}>
                  {(l.rank || "newcomer").replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
