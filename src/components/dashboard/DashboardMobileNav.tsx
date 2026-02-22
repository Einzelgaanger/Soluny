import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquareText,
  Users,
  Wallet,
  User,
} from "lucide-react";
import { useUnreadCount } from "@/pages/Community";

const DashboardMobileNav = () => {
  const location = useLocation();
  const unreadCount = useUnreadCount();

  const navItems = [
    { icon: LayoutDashboard, label: "Home", path: "/dashboard", badge: 0, exact: true },
    { icon: MessageSquareText, label: "Q&A", path: "/dashboard/questions", badge: 0, exact: false },
    { icon: Users, label: "Community", path: "/dashboard/community", badge: unreadCount, exact: false },
    { icon: Wallet, label: "Earn", path: "/dashboard/earnings", badge: 0, exact: false },
    { icon: User, label: "Me", path: "/dashboard/profile", badge: 0, exact: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = item.exact ? location.pathname === item.path : (location.pathname === item.path || location.pathname.startsWith(item.path + "/"));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[48px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_rgba(245,189,65,0.5)]" : ""}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {active && !item.badge && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={`text-[9px] font-medium ${active ? "font-bold" : ""}`}>
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
