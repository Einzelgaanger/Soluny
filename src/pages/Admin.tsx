import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2, Users, MessageSquareText, Wallet, Shield, Search,
  Ban, CheckCircle, AlertTriangle, TrendingUp, BarChart3,
  Flag, Eye, Trash2, LogOut, Zap
} from "lucide-react";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");
  const [loadingData, setLoadingData] = useState(true);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const roles = data?.map((r: any) => r.role) || [];
        setIsAdmin(roles.includes("admin"));
      });
  }, [user]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    const loadAll = async () => {
      const [profilesRes, questionsRes, flagsRes, earningsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("flags").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("earnings").select("*").order("created_at", { ascending: false }).limit(100),
      ]);

      setUsers(profilesRes.data || []);
      setQuestions(questionsRes.data || []);
      setFlags(flagsRes.data || []);
      setEarnings(earningsRes.data || []);

      // Calculate stats
      const totalUsers = profilesRes.data?.length || 0;
      const totalQuestions = questionsRes.data?.length || 0;
      const totalEarnings = earningsRes.data?.reduce((sum: number, e: any) => sum + Number(e.amount_kes), 0) || 0;
      const pendingFlags = flagsRes.data?.filter((f: any) => f.status === "pending").length || 0;

      setStats({ totalUsers, totalQuestions, totalEarnings, pendingFlags });
      setLoadingData(false);
    };
    loadAll();
  }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuestions = questions.filter(
    (q) =>
      !search ||
      q.title?.toLowerCase().includes(search.toLowerCase())
  );

  const removeQuestion = async (questionId: string) => {
    const { error } = await supabase
      .from("questions")
      .update({ status: "removed" as any })
      .eq("id", questionId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Question removed");
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: "removed" } : q))
      );
    }
  };

  const resolveFlag = async (flagId: string) => {
    const { error } = await supabase
      .from("flags")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", flagId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Flag resolved");
      setFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, status: "resolved" } : f))
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/30">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <span className="text-sm font-bold">Soluny Admin</span>
              <span className="text-[10px] text-muted-foreground ml-2">Control Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard →</a>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-info" },
              { label: "Questions", value: stats.totalQuestions, icon: MessageSquareText, color: "text-success" },
              { label: "Total Earnings (KES)", value: `${stats.totalEarnings.toLocaleString()}`, icon: Wallet, color: "text-primary" },
              { label: "Pending Flags", value: stats.pendingFlags, icon: AlertTriangle, color: stats.pendingFlags > 0 ? "text-destructive" : "text-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-xl font-bold font-mono">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/40 h-9 text-sm"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card border border-border/40">
            <TabsTrigger value="overview" className="text-xs">
              <BarChart3 className="h-3.5 w-3.5 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1" /> Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs">
              <MessageSquareText className="h-3.5 w-3.5 mr-1" /> Questions
            </TabsTrigger>
            <TabsTrigger value="flags" className="text-xs">
              <Flag className="h-3.5 w-3.5 mr-1" /> Flags ({flags.filter((f: any) => f.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs">
              <Wallet className="h-3.5 w-3.5 mr-1" /> Earnings
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Recent users */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Users</h3>
                <div className="divide-y divide-border/20">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <span className="font-medium text-xs">{u.display_name || "Anonymous"}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{u.subscription_plan}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{u.cp_balance} CP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent questions */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Questions</h3>
                <div className="divide-y divide-border/20">
                  {questions.slice(0, 5).map((q) => (
                    <div key={q.id} className="py-2">
                      <div className="text-xs font-medium truncate">{q.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] h-4">{q.status}</Badge>
                        <span>{q.answer_count} answers</span>
                        <span>KES {Number(q.prize_pool_kes || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscription distribution */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Subscription Distribution</h3>
              <div className="flex flex-wrap gap-2">
                {["free", "bronze", "silver", "gold", "platinum"].map((plan) => {
                  const count = users.filter((u) => u.subscription_plan === plan).length;
                  return (
                    <div key={plan} className="bg-secondary/30 rounded-lg px-3 py-2 text-center min-w-[80px]">
                      <div className="text-sm font-mono font-bold">{count}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{plan}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="mt-4">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 text-left">
                      <th className="p-3 font-semibold text-muted-foreground">User</th>
                      <th className="p-3 font-semibold text-muted-foreground">Rank</th>
                      <th className="p-3 font-semibold text-muted-foreground">Plan</th>
                      <th className="p-3 font-semibold text-muted-foreground">CP</th>
                      <th className="p-3 font-semibold text-muted-foreground">Balance</th>
                      <th className="p-3 font-semibold text-muted-foreground">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/5">
                        <td className="p-3">
                          <div className="font-medium">{u.display_name || "Anonymous"}</div>
                          <div className="text-[9px] text-muted-foreground font-mono">{u.user_id?.slice(0, 8)}...</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[9px] h-4 capitalize">{u.rank}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[9px] h-4 capitalize">{u.subscription_plan}</Badge>
                        </td>
                        <td className="p-3 font-mono">{u.cp_balance}</td>
                        <td className="p-3 font-mono">KES {Number(u.available_balance_kes || 0).toLocaleString()}</td>
                        <td className="p-3 font-mono">KES {Number(u.total_earnings_kes || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Questions */}
          <TabsContent value="questions" className="mt-4">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 text-left">
                      <th className="p-3 font-semibold text-muted-foreground">Title</th>
                      <th className="p-3 font-semibold text-muted-foreground">Type</th>
                      <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      <th className="p-3 font-semibold text-muted-foreground">Answers</th>
                      <th className="p-3 font-semibold text-muted-foreground">Pool</th>
                      <th className="p-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-muted/5">
                        <td className="p-3 max-w-[250px]">
                          <div className="font-medium truncate">{q.title}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[9px] h-4 capitalize">{q.type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={q.status === "open" ? "default" : q.status === "removed" ? "destructive" : "secondary"}
                            className="text-[9px] h-4"
                          >
                            {q.status}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono">{q.answer_count}</td>
                        <td className="p-3 font-mono">KES {Number(q.prize_pool_kes || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => window.open(`/dashboard/questions/${q.id}`, "_blank")}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {q.status !== "removed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeQuestion(q.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Flags */}
          <TabsContent value="flags" className="mt-4">
            {flags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No flags reported
              </div>
            ) : (
              <div className="space-y-2">
                {flags.map((f) => (
                  <div key={f.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                    <Flag className={`h-4 w-4 shrink-0 mt-0.5 ${f.status === "pending" ? "text-destructive" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={f.status === "pending" ? "destructive" : "secondary"} className="text-[9px] h-4">
                          {f.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground capitalize">{f.content_type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.reason}</p>
                      <p className="text-[9px] font-mono text-muted-foreground mt-1">Content: {f.content_id.slice(0, 8)}... | Reporter: {f.reporter_id.slice(0, 8)}...</p>
                    </div>
                    {f.status === "pending" && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => resolveFlag(f.id)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Earnings */}
          <TabsContent value="earnings" className="mt-4">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30 text-left">
                      <th className="p-3 font-semibold text-muted-foreground">User</th>
                      <th className="p-3 font-semibold text-muted-foreground">Amount</th>
                      <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      <th className="p-3 font-semibold text-muted-foreground">Method</th>
                      <th className="p-3 font-semibold text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {earnings.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/5">
                        <td className="p-3 font-mono text-[10px]">{e.user_id.slice(0, 12)}...</td>
                        <td className="p-3 font-mono font-bold">KES {Number(e.amount_kes).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge
                            variant={e.payout_status === "completed" ? "default" : e.payout_status === "failed" ? "destructive" : "secondary"}
                            className="text-[9px] h-4"
                          >
                            {e.payout_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{e.payout_method || "—"}</td>
                        <td className="p-3 text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
