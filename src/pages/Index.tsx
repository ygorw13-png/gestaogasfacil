
import React, { useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const { user, loading, error } = useAuth();
  const { homePath, isLoading: roleLoading } = useUserRole();

  const renderContent = useCallback(() => {
    if (loading || (user && roleLoading)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" message="Carregando..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Alert variant="warning" className="max-w-md">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Erro de autenticação</AlertTitle>
            <AlertDescription>
              {error.message || "Ocorreu um erro ao verificar sua autenticação. Por favor, tente novamente."}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // Cada papel abre na sua própria página inicial
    return user ? <Navigate to={homePath} replace /> : <Navigate to="/login" replace />;
  }, [user, loading, error, homePath, roleLoading]);

  return renderContent();
};

export default React.memo(Index);
