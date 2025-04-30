
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { validatePasswordStrength } from '@/utils/securityUtils';

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

// Change password for authenticated user
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    // Validar força da nova senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message };
    }
    
    // Verificar senha atual (autenticação)
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email;
    
    if (!email) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Verificar se a senha atual está correta
    const { error: verificationError } = await supabase.auth.signInWithPassword({ 
      email, 
      password: currentPassword 
    });
    
    if (verificationError) {
      logger.warn("Falha na verificação de senha atual", { module: 'auth', user: sessionData.session?.user?.id });
      return { success: false, error: 'Senha atual incorreta' };
    }
    
    // Atualizar senha
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      logger.error("Erro ao atualizar senha", { module: 'auth', user: sessionData.session?.user?.id }, error);
      throw error;
    }
    
    logger.info("Senha atualizada com sucesso", { module: 'auth', user: sessionData.session?.user?.id });
    
    return { success: true };
  } catch (err) {
    logger.error("Erro ao alterar senha", { module: 'auth' }, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao alterar senha' 
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

// Request a password reset
export const resetPassword = async (email: string) => {
  try {
    const sanitizedEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) {
      logger.error("Erro ao solicitar redefinição de senha", { module: 'auth' }, error);
      throw error;
    }
    
    logger.info("Solicitação de redefinição de senha enviada", { module: 'auth' });
    
    return { success: true };
  } catch (err) {
    logger.error("Erro ao solicitar redefinição de senha", { module: 'auth' }, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao solicitar redefinição de senha' 
    };
  }
};

// Update password after reset
export const updatePasswordAfterReset = async (newPassword: string) => {
  try {
    // Validar força da nova senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message };
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      logger.error("Erro ao atualizar senha após redefinição", { module: 'auth' }, error);
      throw error;
    }
    
    logger.info("Senha atualizada após redefinição", { module: 'auth' });
    
    return { success: true };
  } catch (err) {
    logger.error("Erro ao atualizar senha após redefinição", { module: 'auth' }, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao atualizar senha após redefinição' 
    };
  }
};
