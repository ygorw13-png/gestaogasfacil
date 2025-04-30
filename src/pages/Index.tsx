
import React, { useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const { user, loading, error } = useAuth();

  const renderContent = useCallback(() => {
    if (loading) {
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
    
    // Redirecionar para o login se não estiver autenticado
    // Só vai para o dashboard quando já estiver autenticado
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
  }, [user, loading, error]);

  return renderContent();
};

export default React.memo(Index);
