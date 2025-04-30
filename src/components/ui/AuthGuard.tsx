
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useCsrfProtection } from '@/utils/csrfProtection';
import { useSecurityTimeout } from '@/hooks/useSecurityTimeout';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login'
}) => {
  const { user, loading, error, signOut } = useAuth();
  const location = useLocation();
  const { refreshCsrfToken } = useCsrfProtection();

  // Melhor log para depuração
  useEffect(() => {
    console.log("AuthGuard - Estado de autenticação:", { 
      path: location.pathname,
      isLoading: loading, 
      hasUser: !!user,
      errorMsg: error?.message
    });
  }, [loading, user, error, location.pathname]);

  // Atualizar o token CSRF apenas uma vez quando o componente montar
  useEffect(() => {
    if (!user) return; // Não atualizar o token se não houver usuário
    
    const handleRefreshToken = () => {
      refreshCsrfToken();
    };
    
    // Executar apenas uma vez na montagem do componente quando usuário estiver autenticado
    handleRefreshToken();
    // Importante: Não incluir refreshCsrfToken na lista de dependências para evitar loop infinito
  }, [user]);
  
  // Configurar logout automático após 30 minutos de inatividade
  useSecurityTimeout({
    timeoutMinutes: 30,
    onTimeout: () => {
      if (user) {
        console.log("Sessão expirada por inatividade");
        signOut();
      }
    }
  });

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
    console.log("AuthGuard - Usuário não autenticado, redirecionando para login de:", location.pathname);
    // Salvar a localização atual para redirecionar de volta após o login
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
