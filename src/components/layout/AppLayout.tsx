
import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Simular carregamento dos dados do aplicativo
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  console.log("AppLayout - Auth state:", loading ? "loading" : (user ? "authenticated" : "not authenticated"));

  // Se estiver carregando dados de autenticação, exibir spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gasflow-500 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-semibold text-gasflow-500">Carregando...</h2>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para o login
  if (!user) {
    console.log("AppLayout - User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Se estiver carregando dados do app, exibir spinner
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
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col min-h-screen w-full md:pl-64">
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
