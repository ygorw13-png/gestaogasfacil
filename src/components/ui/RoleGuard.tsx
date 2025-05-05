
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useCsrfProtection } from '@/utils/csrfProtection';
import { useSecurityTimeout } from '@/hooks/useSecurityTimeout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Made optional since we're ignoring roles
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [], // Not used anymore
  redirectTo = '/dashboard'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Log for debugging
  useEffect(() => {
    console.log("RoleGuard - State:", {
      path: location.pathname, 
      isLoading: loading, 
      hasUser: !!user,
    });
  }, [user, loading, location.pathname]);

  // If still loading, show the spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" message="Verificando acesso..." />
      </div>
    );
  }

  // If no user is logged in, redirect to login
  if (!user) {
    console.log("RoleGuard - Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // User is authenticated, allow access to all pages
  return <>{children}</>;
};
