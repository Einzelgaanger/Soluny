import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, MessageSquareText, Coins, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  {
    label: "Total Earnings",
    value: "KES 0",
    change: "+0%",
    positive: true,
    icon: Coins,
    glow: "",
  },
  {
    label: "Contribution Points",
    value: "0 CP",
    change: "Newcomer",
    positive: true,
    icon: Award,
    glow: "glow-variant-info",
  },
  {
    label: "Answers Submitted",
    value: "0",
    change: "This month",
    positive: true,
    icon: MessageSquareText,
    glow: "glow-variant-success",
  },
  {
    label: "Vote Score",
    value: "0",
    change: "Net score",
    positive: true,
    icon: TrendingUp,
    glow: "",
  },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, <span className="text-gradient-gold">{user?.user_metadata?.display_name || "Solver"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your SOLVR overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`glass-card glass-card-hover stat-card-glow ${s.glow} rounded-xl p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold font-mono tracking-tight">{s.value}</div>
              <div className="flex items-center gap-1 text-xs font-semibold">
                {s.positive ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={s.positive ? "text-success" : "text-destructive"}>{s.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity placeholder */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold tracking-tight mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity yet. Start by answering a question!</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
