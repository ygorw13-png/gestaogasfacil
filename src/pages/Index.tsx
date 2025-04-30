
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Index page - Auth state:", loading ? "loading" : (user ? "authenticated" : "not authenticated"));
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gasflow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gasflow-500 font-medium">Carregando...</p>
      </div>
    );
  }
  
  // Redirect to dashboard if authenticated, otherwise to login page
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;
