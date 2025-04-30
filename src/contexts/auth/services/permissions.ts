
import { User } from '@supabase/supabase-js';

// Verificar se um usuário tem um papel específico
export const hasUserRole = (user: User | null, roles: string | string[]) => {
  if (!user) return false;
  
  // Se o usuário não tiver role definido, considerar como 'authenticated'
  const userRole = user.role || 'authenticated';
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
};

// Função para obter o papel atual do usuário
export const getUserRole = (user: User | null): string => {
  if (!user) return 'anonymous';
  return user.role || 'authenticated';
};
