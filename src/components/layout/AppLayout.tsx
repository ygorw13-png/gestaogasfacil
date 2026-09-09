
import { useState, useEffect, memo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";
import { GlobalQuickSale } from "./GlobalQuickSale";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { FechamentoReminder } from "@/components/portaria/FechamentoReminder";
import { useUserRole } from "@/hooks/useUserRole";
import { EntregadorLayout } from "./EntregadorLayout";


// Content component to manage layout based on sidebar state
const MainContent = memo(() => {
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "flex min-w-0 flex-1 flex-col min-h-screen transition-all duration-300",
      isMobile ? "ml-0" : isOpen ? "ml-64" : "ml-16"
    )}>
      <TopBar />
      <OfflineBanner />
      <FechamentoReminder />
      <ErrorBoundary>
        <main className="w-full max-w-full flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </ErrorBoundary>
      {isMobile && <div className="h-16" />}
    </div>
  );
});


MainContent.displayName = 'MainContent';

export function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isEntregador, isLoading: roleLoading } = useUserRole();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log("AppLayout - Mounted:", { 
      path: location.pathname,
      hasUser: !!user,
      isMobile
    });
  }, [location.pathname, user, isMobile]);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      console.log("AppLayout - User not authenticated, redirecting to login");
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }

    // Simulate loading only if we have an authenticated user
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [user, navigate, location]);

  // Focus main content when loaded
  useEffect(() => {
    if (!isLoading) {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          mainContent.focus();
        }, 100);
      }
    }
  }, [isLoading]);

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" role="status" aria-live="polite">
        <LoadingSpinner size="lg" message="GásFácil Manager" />
      </div>
    );
  }

  // Entregador tem uma tela própria, sem menu e sem dashboard
  if (isEntregador) return <EntregadorLayout />;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <MainContent />
        <GlobalQuickSale />
      </div>
    </SidebarProvider>
  );
}
