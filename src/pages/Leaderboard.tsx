import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy } from "lucide-react";
import { getRankConfig } from "@/lib/ranks";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, cp_balance, rank, avatar_url, total_earnings_kes")
      .order("cp_balance", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setLeaders(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Leaderboard</h1>
          <span className="text-[10px] text-muted-foreground">Top 50 by CP</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No data yet
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {leaders.length >= 3 && (
              <div className="flex items-end justify-center gap-2 py-4">
                {[1, 0, 2].map((idx) => {
                  const l = leaders[idx];
                  if (!l) return null;
                  const rank = getRankConfig(l.rank || "newcomer");
                  const isFirst = idx === 0;
                  return (
                    <div key={idx} className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                      <div className={`relative ${isFirst ? "mb-2" : "mb-1"}`}>
                        <img
                          src={rank.image}
                          alt={rank.label}
                          className={`${isFirst ? "h-16 w-16" : "h-12 w-12"} rounded-xl object-cover border-2 ${isFirst ? "border-primary glow-gold" : "border-border/40"}`}
                        />
                        <div className={`absolute -bottom-1 -right-1 ${isFirst ? "h-6 w-6 text-xs" : "h-5 w-5 text-[10px]"} rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                        }`}>
                          {idx + 1}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold truncate max-w-[70px]">{l.display_name || "Anon"}</span>
                      <span className="text-[10px] font-mono font-bold text-primary">{l.cp_balance} CP</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List */}
            <div className="divide-y divide-border/20">
              {leaders.map((l, i) => {
                const rank = getRankConfig(l.rank || "newcomer");
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-1 hover:bg-muted/5 transition-colors">
                    <span className="text-[11px] font-mono text-muted-foreground w-6 text-right shrink-0">{i + 1}</span>
                    <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 bg-secondary">
                      {l.avatar_url ? (
                        <img src={l.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={rank.image} alt={rank.label} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{l.display_name || "Anonymous"}</span>
                        <span className={`text-[10px] ${rank.color}`}>{rank.animal}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold">{l.cp_balance}</div>
                      <div className="text-[9px] text-muted-foreground">CP</div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-[10px] font-mono text-muted-foreground">KES {Number(l.total_earnings_kes || 0).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
