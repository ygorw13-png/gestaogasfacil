
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Index page - Auth state:", loading ? "loading" : (user ? "authenticated" : "not authenticated"));
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" message="Carregando..." />
      </div>
    );
  }
  
  // Redirecionar para o dashboard apenas se autenticado, caso contrário para login
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
