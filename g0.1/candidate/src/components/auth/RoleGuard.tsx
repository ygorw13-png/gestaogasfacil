import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
const allowed=['/entregador/entregas','/entregador/venda-rua','/entregador/cadastro','/entregador/perfil'];
export function RoleGuard({children}:{children:React.ReactNode}) {
  const {session,permissions}=useAuth();
  const {role,isLoading}=useUserRole();
  const location=useLocation();
  if (isLoading) return <LoadingSpinner message="Verificando acesso..." />;
  if (!session || !role || !permissions.ready || permissions.error) return <Navigate to="/login" replace />;
  if (role==='entregador' && !allowed.some(p=>location.pathname===p || location.pathname.startsWith(p+'/'))) return <Navigate to="/entregador/entregas" replace />;
  return <>{children}</>;
}