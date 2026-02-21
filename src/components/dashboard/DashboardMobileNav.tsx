import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquareText,
  Trophy,
  Wallet,
  User,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: MessageSquareText, label: "Questions", path: "/dashboard/questions" },
  { icon: Trophy, label: "Ranks", path: "/dashboard/leaderboard" },
  { icon: Wallet, label: "Earnings", path: "/dashboard/earnings" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
];

const DashboardMobileNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className={`relative ${active ? "" : ""}`}>
                <item.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_rgba(245,189,65,0.5)]" : ""}`} />
                {active && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardMobileNav;
