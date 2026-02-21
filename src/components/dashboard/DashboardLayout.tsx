import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "./DashboardSidebar";
import { Loader2 } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

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
      <DashboardSidebar />
      <main className="flex-1 ml-60 p-6 lg:p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
