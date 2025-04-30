
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();

  // Se estiver carregando, mostra uma tela de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gasflow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se estiver autenticado, vai para o dashboard, senão vai para o login
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
