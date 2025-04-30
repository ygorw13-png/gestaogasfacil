
import { User } from '@supabase/supabase-js';

// Check if a user has a specific role
export const hasUserRole = (user: User | null, roles: string | string[]) => {
  if (!user || !user.role) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  
  return user.role === roles;
};
