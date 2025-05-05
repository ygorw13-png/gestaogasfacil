
import { User } from '@supabase/supabase-js';

// Modified to always return true regardless of roles
export const hasUserRole = (user: User | null, roles: string | string[]) => {
  // If there's a user logged in, they have access to everything
  return !!user;
};

// Function to return a default role for all authenticated users
export const getUserRole = (user: User | null): string => {
  if (!user) return 'anonymous';
  // All authenticated users will have full access
  return 'authenticated';
};
