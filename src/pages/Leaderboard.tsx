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
      <div className="space-y-4 lg:space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-lg lg:text-2xl font-bold tracking-tight">Leaderboard</h1>
          <span className="text-[10px] lg:text-xs text-muted-foreground">Top 50 by CP</span>
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
              <div className="flex items-end justify-center gap-2 lg:gap-6 py-4 lg:py-8">
                {[1, 0, 2].map((idx) => {
                  const l = leaders[idx];
                  if (!l) return null;
                  const rank = getRankConfig(l.rank || "newcomer");
                  const isFirst = idx === 0;
                  return (
                    <div key={idx} className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                      <div className={`relative ${isFirst ? "mb-2 lg:mb-3" : "mb-1 lg:mb-2"}`}>
                        {/* Avatar with rank icon overlay */}
                        <div className={`${isFirst ? "h-16 w-16 lg:h-24 lg:w-24" : "h-12 w-12 lg:h-18 lg:w-18"} rounded-xl lg:rounded-2xl overflow-hidden border-2 ${isFirst ? "border-primary" : "border-border/40"}`}>
                          {l.avatar_url ? (
                            <img src={l.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center">
                              <span className={`${isFirst ? "text-xl lg:text-3xl" : "text-lg lg:text-2xl"} font-bold text-muted-foreground`}>
                                {(l.display_name || "?")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Rank image badge */}
                        <img
                          src={rank.image}
                          alt={rank.label}
                          className={`absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 ${isFirst ? "h-7 w-7 lg:h-10 lg:w-10" : "h-5 w-5 lg:h-8 lg:w-8"} rounded-lg border-2 border-background object-cover`}
                        />
                        {/* Position badge */}
                        <div className={`absolute -top-1 -left-1 lg:-top-2 lg:-left-2 ${isFirst ? "h-6 w-6 lg:h-8 lg:w-8 text-xs lg:text-sm" : "h-5 w-5 lg:h-7 lg:w-7 text-[10px] lg:text-xs"} rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? "bg-primary text-primary-foreground" : idx === 1 ? "bg-secondary text-foreground" : "bg-secondary text-foreground"
                        }`}>
                          {idx + 1}
                        </div>
                      </div>
                      <span className="text-[11px] lg:text-sm font-semibold truncate max-w-[70px] lg:max-w-[120px]">{l.display_name || "Anon"}</span>
                      <span className={`text-[10px] lg:text-xs font-bold ${rank.color}`}>{rank.label}</span>
                      <span className="text-[10px] lg:text-xs font-mono font-bold text-primary">{l.cp_balance} CP</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List — mobile compact, desktop wider */}
            <div className="divide-y divide-border/20">
              {leaders.map((l, i) => {
                const rank = getRankConfig(l.rank || "newcomer");
                return (
                  <div key={i} className="flex items-center gap-3 lg:gap-4 py-2 lg:py-3 px-1 lg:px-3 hover:bg-muted/5 transition-colors rounded-lg">
                    <span className="text-[11px] lg:text-sm font-mono text-muted-foreground w-6 lg:w-8 text-right shrink-0">{i + 1}</span>
                    {/* Avatar */}
                    <div className="h-7 w-7 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl overflow-hidden shrink-0 bg-secondary">
                      {l.avatar_url ? (
                        <img src={l.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] lg:text-sm font-bold text-muted-foreground">
                          {(l.display_name || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Rank image */}
                    <img src={rank.image} alt={rank.label} className="h-5 w-5 lg:h-7 lg:w-7 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <span className="text-xs lg:text-sm font-medium truncate">{l.display_name || "Anonymous"}</span>
                        <span className={`text-[10px] lg:text-xs font-bold ${rank.color}`}>{rank.label}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs lg:text-sm font-mono font-bold">{l.cp_balance}</div>
                      <div className="text-[9px] lg:text-[10px] text-muted-foreground">CP</div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-[10px] lg:text-xs font-mono text-muted-foreground">KES {Number(l.total_earnings_kes || 0).toLocaleString()}</div>
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
