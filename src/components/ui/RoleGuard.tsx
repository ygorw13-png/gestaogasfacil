
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
  allowedRoles: string[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard'
}) => {
  const { user, loading, hasRole } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Log para depuração
  useEffect(() => {
    console.log("RoleGuard - Estado:", {
      path: location.pathname, 
      isLoading: loading, 
      hasUser: !!user,
      userRole: user?.role || 'authenticated', // Assumir 'authenticated' se não tiver role
      allowedRoles
    });
  }, [user, loading, allowedRoles, location.pathname]);

  // Registrar tentativas de acesso não autorizado
  useEffect(() => {
    if (!loading && user && !allowedRoles.some(role => hasRole(role))) {
      console.warn(`Tentativa de acesso não autorizado detectada: usuário ${user.id} tentou acessar ${location.pathname}`);
      
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive"
      });
    }
  }, [user, loading, hasRole, allowedRoles, location.pathname, toast]);

  // Se ainda estiver carregando, mostra o spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" message="Verificando permissões..." />
      </div>
    );
  }

  // Se não tiver usuário, redireciona para login
  if (!user) {
    console.log("RoleGuard - Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Assumir que o usuário tem o papel 'authenticated' se não tiver um papel específico definido
  const userHasRole = allowedRoles.includes('authenticated') || 
                     allowedRoles.some(role => hasRole(role));

  // Verificar se o usuário tem um papel permitido
  if (!userHasRole) {
    return (
      <div className="p-4 flex flex-col space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. 
            {!user?.role && " Seu perfil de usuário está configurado como 'authenticated'."}
          </AlertDescription>
        </Alert>
        
        <Button 
          variant="default" 
          onClick={() => navigate(redirectTo)}
          className="w-full"
        >
          Voltar para o Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
