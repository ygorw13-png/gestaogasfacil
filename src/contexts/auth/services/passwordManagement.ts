
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { validatePasswordStrength } from '@/utils/securityUtils';

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
