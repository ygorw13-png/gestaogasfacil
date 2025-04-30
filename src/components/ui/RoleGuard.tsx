
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/userTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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
  const { user, loading } = useAuth();

  // Se ainda estiver carregando, não faça nada
  if (loading) return null;

  // Verificar se o usuário tem um papel e se está na lista de papéis permitidos
  if (!user || !user.role || !allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
        {redirectTo && <Navigate to={redirectTo} replace />}
      </div>
    );
  }

  return <>{children}</>;
};
