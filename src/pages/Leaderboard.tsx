import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Trophy, Medal, Award } from "lucide-react";

const mockLeaders = [
  { rank: 1, name: "—", cp: 0, tier: "Grand Master" },
  { rank: 2, name: "—", cp: 0, tier: "Sage" },
  { rank: 3, name: "—", cp: 0, tier: "Scholar" },
];

const Leaderboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top contributors this month</p>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_120px_120px] gap-4 px-5 py-3 border-b border-border/40">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Rank</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solver</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">CP</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">Tier</span>
          </div>
          {mockLeaders.map((l) => (
            <div key={l.rank} className="grid grid-cols-[60px_1fr_120px_120px] gap-4 px-5 py-4 border-b border-border/40 hover:bg-muted/30 transition-colors">
              <div className="flex items-center">
                {l.rank === 1 ? (
                  <Trophy className="h-5 w-5 text-primary" />
                ) : l.rank === 2 ? (
                  <Medal className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Award className="h-5 w-5 text-muted-foreground/60" />
                )}
              </div>
              <span className="text-sm font-medium">{l.name}</span>
              <span className="text-sm font-mono text-right">{l.cp}</span>
              <span className="text-xs text-right text-muted-foreground">{l.tier}</span>
            </div>
          ))}
          <div className="p-8 text-center text-muted-foreground text-sm">
            Leaderboard populates as the community grows
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
