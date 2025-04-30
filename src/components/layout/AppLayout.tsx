
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Simulate loading app data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gasflow-500 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-semibold text-gasflow-500">GasFlow Aqua Manager</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-col min-h-screen md:pl-64">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
        {isMobile && (
          <div className="h-16"></div> /* Espaço para navegação móvel */
        )}
      </div>
    </div>
  );
}
