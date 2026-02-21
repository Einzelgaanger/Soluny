import { ReactNode, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "./DashboardSidebar";
import DashboardMobileNav from "./DashboardMobileNav";
import { Loader2 } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      {/* Mobile bottom nav */}
      <DashboardMobileNav />
      <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 ${
        sidebarCollapsed ? "md:ml-[72px]" : "md:ml-60"
      }`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
