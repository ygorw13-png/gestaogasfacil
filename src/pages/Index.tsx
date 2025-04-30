
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const { user, loading, error } = useAuth();

  useEffect(() => {
    console.log("Index page - Estado de autenticação:", loading ? "carregando" : (user ? "autenticado" : "não autenticado"));
  }, [user, loading]);

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
  
  // Redirecionar para o dashboard apenas se autenticado, caso contrário para login
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
