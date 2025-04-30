
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { validatePasswordStrength } from '@/utils/securityUtils';

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

// Register a new user with email
export const signUpWithEmail = async (email: string, password: string, userData?: { name?: string }) => {
  try {
    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      logger.warn("Tentativa de cadastro com senha fraca", { module: 'auth' });
      return { success: false, error: passwordValidation.message };
    }
    
    // Sanitizar entrada
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Registrar usuário
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) {
      logger.error("Erro ao registrar usuário", { module: 'auth' }, error);
      throw error;
    }
    
    // Log de sucesso com ID do usuário
    if (data.user) {
      logger.info("Novo usuário registrado", { module: 'auth', user: data.user.id });
    }
    
    return { success: true, user: data.user };
  } catch (err) {
    logger.error("Erro ao registrar usuário", { module: 'auth' }, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao registrar usuário' 
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
