import { useAuth } from '@/contexts/auth';
import { verifiedRole } from '../contexts/auth/services/permissions';
export type UserRole = 'admin'|'user'|'entregador';
export function useUserRole() {
  const {permissions,profile,loading}=useAuth();
  const role=verifiedRole(permissions);
  return {
    role, name:profile?.name, isEntregador:role==='entregador',isAdmin:role==='admin',
    isPortaria:false,
    homePath:role==='entregador' ? '/entregador/entregas' : role ? '/painel' : '/login',
    isLoading:loading,
  };
}