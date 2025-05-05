
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

  // Debug logging
  useEffect(() => {
    console.log("AuthGuard - Estado de autenticação:", { 
      path: location.pathname,
      isLoading: loading, 
      hasUser: !!user,
      errorMsg: error?.message
    });
  }, [loading, user, error, location.pathname]);

  // Update CSRF token only once when component mounts
  useEffect(() => {
    if (!user) return; // Don't update token if there's no user
    
    const handleRefreshToken = () => {
      refreshCsrfToken();
    };
    
    // Run only once on component mount when user is authenticated
    handleRefreshToken();
  }, [user, refreshCsrfToken]);
  
  // Set up automatic logout after 30 minutes of inactivity
  useSecurityTimeout({
    timeoutMinutes: 30,
    onTimeout: () => {
      if (user) {
        console.log("Session expired due to inactivity");
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

  // If no user is logged in, redirect to login
  if (!user) {
    console.log("AuthGuard - Usuário não autenticado, redirecionando para login de:", location.pathname);
    // Save current location to redirect back after login
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
