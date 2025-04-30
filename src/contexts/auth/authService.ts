
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Fetch user profile from the server
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('get_user_profile', {
      body: { user_id: userId },
    });

    if (error) throw error;
    
    return data?.organizations || null;
  } catch (err) {
    logger.error('Erro ao buscar perfil de usuário', { module: 'auth', user: userId }, err);
    throw err instanceof Error ? err : new Error('Erro ao buscar informações do usuário');
  }
};

// Sign in the user
export const signInWithEmail = async (email: string, password: string, options?: { csrfToken?: string }) => {
  try {
    // Log de tentativa (sem a senha)
    logger.auth.loginAttempt(email);
    
    // Sanitizar entrada
    const sanitizedEmail = email.trim().toLowerCase();
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: sanitizedEmail, 
      password 
    });
    
    if (error) {
      logger.auth.loginFailure(sanitizedEmail, error.message);
      throw error;
    }
    
    // Log de sucesso com ID do usuário (não o email para maior privacidade)
    if (data.user) {
      logger.auth.loginSuccess(data.user.id);
    }
    
    return { success: true };
  } catch (err) {
    logger.error("Erro ao fazer login", { module: 'auth' }, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao fazer login' 
    };
  }
};

// Sign out the user
export const signOut = async () => {
  // Captura o ID do usuário antes de fazer logout
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;

  const { error } = await supabase.auth.signOut();
  
  if (userId) {
    logger.auth.logout(userId);
  }
  
  if (error) throw error;
};

// Get the current session
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logger.error("Erro ao obter sessão atual", { module: 'auth' }, error);
    throw error;
  }
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
