
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/types/userTypes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
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

  // Se ainda estiver carregando, não faça nada
  if (loading) return null;

  // Verificar se o usuário tem um papel e se está na lista de papéis permitidos
  if (!user || !allowedRoles.some(role => hasRole(role))) {
    return (
      <div className="p-4 flex flex-col space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. 
            {!user?.role && " Seu perfil de usuário não possui um papel definido."}
          </AlertDescription>
        </Alert>
        
        <Button 
          variant="default" 
          onClick={() => navigate(redirectTo)}
          className="w-full"
        >
          Voltar para o Dashboard
        </Button>
        
        {redirectTo && <Navigate to={redirectTo} replace state={{ from: location }} />}
      </div>
    );
  }

  return <>{children}</>;
};
