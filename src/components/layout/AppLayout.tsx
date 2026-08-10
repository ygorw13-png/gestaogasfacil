
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


// Content component to manage layout based on sidebar state
const MainContent = memo(() => {
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  const isMobile = useIsMobile();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log("MainContent - Rendered:", {
      path: location.pathname,
      sidebarState: sidebar.state,
      isMobile
    });
  }, [location.pathname, sidebar.state, isMobile]);

  return (
    <div className={cn(
      "flex flex-col min-h-screen flex-1 transition-all duration-300",
      isOpen && !isMobile ? "ml-64" : "ml-16",
      isMobile ? "ml-0" : ""
    )}>
      <TopBar />
      <OfflineBanner />
      <ErrorBoundary>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </ErrorBoundary>
      {isMobile && (
        <div className="h-16">{/* Space for mobile navigation */}</div>
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

export function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" role="status" aria-live="polite">
        <LoadingSpinner size="lg" message="GásFácil Manager" />
      </div>
    );
  }

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
