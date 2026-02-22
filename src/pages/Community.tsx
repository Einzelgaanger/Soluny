import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, Users } from "lucide-react";
import { getRankConfig } from "@/lib/ranks";

const Community = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles")
      .select("user_id, display_name, username, avatar_url, rank, cp_balance, total_earnings_kes")
      .order("cp_balance", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setTopUsers(data || []);
        setInitialLoading(false);
      });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const { data } = await supabase.from("profiles")
      .select("user_id, display_name, username, avatar_url, rank, cp_balance, total_earnings_kes")
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);
    setResults(data || []);
    setLoading(false);
  };

  const displayList = results.length > 0 ? results : topUsers;

  const renderUserCard = (p: any) => {
    const rank = getRankConfig(p.rank || "newcomer");
    return (
      <Link key={p.user_id} to={`/dashboard/user/${p.user_id}`} className="flex items-center gap-3 py-2.5 lg:py-3 px-2 lg:px-3 hover:bg-muted/5 rounded-lg transition-colors">
        <div className={`${isMobile ? "h-9 w-9" : "h-11 w-11"} rounded-xl bg-secondary overflow-hidden shrink-0`}>
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
              {(p.display_name || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <img src={rank.image} alt="" className="h-5 w-5 lg:h-6 lg:w-6 rounded object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{p.display_name || "Anonymous"}</span>
            {p.username && <span className="text-[10px] lg:text-xs text-muted-foreground">@{p.username}</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] lg:text-xs text-muted-foreground">
            <span className={`font-bold ${rank.color}`}>{rank.label}</span>
            <span className="font-mono">{p.cp_balance} CP</span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-lg lg:text-2xl font-bold tracking-tight">Community</h1>
          <Link to="/dashboard/messages">
            <Button variant="outline" size="sm" className="text-xs h-8 lg:h-9">
              <Users className="h-3.5 w-3.5 mr-1" /> Messages
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by @username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9 lg:h-10 text-sm bg-secondary/30 border-border/40 rounded-xl"
            />
          </div>
          <Button onClick={handleSearch} size="sm" disabled={loading} className="bg-primary text-primary-foreground rounded-xl h-9 lg:h-10 text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="text-xs text-muted-foreground">{results.length} result(s) for "{searchQuery}"</div>
        )}

        {initialLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="divide-y divide-border/20">
            {displayList.map(renderUserCard)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Community;
