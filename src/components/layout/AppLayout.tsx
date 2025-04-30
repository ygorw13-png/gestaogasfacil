
import { useState, useEffect, memo } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const AppLayoutContent = memo(({ user, isLoading }: { user: any, isLoading: boolean }) => {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner size="lg" message="GasFlow Aqua Manager" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col min-h-screen flex-1 transition-all duration-300">
          <TopBar />
          <ErrorBoundary>
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
              <Outlet />
            </main>
          </ErrorBoundary>
          {isMobile && (
            <div className="h-16">{/* Espaço para navegação mobile */}</div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
});

AppLayoutContent.displayName = 'AppLayoutContent';

export function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simular carregamento apenas se tivermos um usuário autenticado
    if (user) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <AuthGuard>
      <AppLayoutContent user={user} isLoading={isLoading} />
    </AuthGuard>
  );
}
