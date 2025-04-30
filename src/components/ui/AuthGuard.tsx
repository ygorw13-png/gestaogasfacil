
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" message="GasFlow Aqua Manager" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Alert variant="warning" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Erro de autenticação</AlertTitle>
          <AlertDescription>
            {error.message || "Ocorreu um erro ao verificar sua autenticação. Por favor, tente fazer login novamente."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    console.log("AuthGuard - Usuário não autenticado, redirecionando para login");
    // Salvar a localização atual para redirecionar de volta após o login
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
