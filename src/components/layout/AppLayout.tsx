
import { useState, useEffect, memo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Componente de conteúdo para gerenciar o layout com base no estado da sidebar
const MainContent = memo(() => {
  const sidebar = useSidebar();
  const isOpen = sidebar.state === "expanded";
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "flex flex-col min-h-screen flex-1 transition-all duration-300",
      isOpen && !isMobile ? "ml-64" : "ml-16",
      isMobile ? "ml-0" : ""
    )}>
      <TopBar />
      <ErrorBoundary>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </ErrorBoundary>
      {isMobile && (
        <div className="h-16">{/* Espaço para navegação mobile */}</div>
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

const AppLayoutContent = memo(({ user, isLoading }: { user: any, isLoading: boolean }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificação adicional de segurança
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
  }, [user, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" role="status" aria-live="polite">
        <LoadingSpinner size="lg" message="GasFlow Aqua Manager" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <MainContent />
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

  // Adicionar foco ao conteúdo principal quando carregado
  useEffect(() => {
    if (!isLoading) {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        // Adicionamos um pequeno delay para garantir que o DOM esteja pronto
        setTimeout(() => {
          mainContent.focus();
        }, 100);
      }
    }
  }, [isLoading]);

  return (
    <AuthGuard>
      <AppLayoutContent user={user} isLoading={isLoading} />
    </AuthGuard>
  );
}

// Esqueci de importar cn, vamos incluí-lo:
import { cn } from "@/lib/utils";
