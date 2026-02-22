import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquareText,
  Trophy,
  Wallet,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import solunyLogo from "@/assets/soluny-logo.png";
import { useUnreadCount } from "@/pages/Community";

const DashboardSidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = useUnreadCount();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", badge: 0 },
    { icon: MessageSquareText, label: "Questions", path: "/dashboard/questions", badge: 0 },
    { icon: Users, label: "Community", path: "/dashboard/community", badge: unreadCount },
    { icon: Trophy, label: "Leaderboard", path: "/dashboard/leaderboard", badge: 0 },
    { icon: Wallet, label: "Earnings", path: "/dashboard/earnings", badge: 0 },
    { icon: User, label: "Profile", path: "/dashboard/profile", badge: 0 },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-[72px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 sm:h-16 border-b border-sidebar-border">
        <img src={solunyLogo} alt="Soluny" className={`h-7 sm:h-8 w-auto ${collapsed ? "mx-auto" : ""}`} />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const btn = (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                active
                  ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border-l-2 border-primary shadow-[inset_0_0_12px_rgba(245,189,65,0.06)]"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 shrink-0" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return btn;
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sign Out"}
        </Button>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
