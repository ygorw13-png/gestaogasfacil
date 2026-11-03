
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
  } catch (err: any) {
    logger.error("Erro ao fazer login", { module: 'auth' }, err);
    let message = err instanceof Error ? err.message : 'Erro ao fazer login';
    const code = err?.code || err?.error_code;
    if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
      message = 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
    } else if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) {
      message = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
    } else if (/failed to fetch|network/i.test(message)) {
      message = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
    } else if (code === 'over_request_rate_limit' || /rate limit/i.test(message)) {
      message = 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
    }
    return { success: false, error: message };
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
  } catch (err: any) {
    logger.error("Erro ao registrar usuário", { module: 'auth' }, err);
    let message = err instanceof Error ? err.message : 'Erro ao registrar usuário';
    const code = err?.code || err?.error_code;
    if (code === 'weak_password' || /pwned|weak.?password|known to be weak/i.test(message)) {
      message = 'Esta senha aparece em vazamentos públicos e não pode ser usada. Escolha uma senha diferente e mais forte.';
    } else if (code === 'user_already_exists' || /already registered|already exists/i.test(message)) {
      message = 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
    } else if (/invalid.*email/i.test(message)) {
      message = 'E-mail inválido.';
    }
    return { success: false, error: message };
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
