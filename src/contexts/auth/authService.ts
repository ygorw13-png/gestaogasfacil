
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Fetch user profile from the server
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('get_user_profile', {
      body: { user_id: userId },
    });

    if (error) throw error;
    
    return data?.organizations || null;
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    throw err instanceof Error ? err : new Error('Erro ao buscar informações do usuário');
  }
};

// Sign in the user
export const signInWithEmail = async (email: string, password: string, options?: { csrfToken?: string }) => {
  try {
    // Sanitizar entrada
    const sanitizedEmail = email.trim().toLowerCase();
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: sanitizedEmail, 
      password 
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao fazer login' 
    };
  }
};

// Sign out the user
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get the current session
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// Check if a user has a specific role
export const hasUserRole = (user: User | null, roles: string | string[]) => {
  if (!user || !user.role) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  
  return user.role === roles;
};
