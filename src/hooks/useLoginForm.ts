
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { sanitizeHtml } from '@/utils/securityUtils';
import { logger } from '@/utils/logger';
import { registerFailedAttempt, checkLoginStatus, resetFailedAttempts } from '@/utils/bruteForceProtection';

export function useLoginForm() {
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler({ toastOnError: false });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signIn } = useAuth();

  // Clear errors when component is mounted or unmounted
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      logger.debug("Login page - User already authenticated, redirecting", { module: 'auth', user: user.id });
      
      // Redirect to previous page if available, otherwise to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (email: string, password: string, csrfToken?: string) => {
    setLoading(true);
    clearError();
    
    // Sanitize inputs to prevent XSS
    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    
    // Check brute force protection
    const loginStatus = checkLoginStatus(sanitizedEmail);
    if (loginStatus.blocked) {
      const minutesLeft = loginStatus.blockExpiresAt 
        ? Math.ceil((loginStatus.blockExpiresAt - Date.now()) / (60 * 1000))
        : 15;
      
      logger.warn("Login attempt blocked due to too many attempts", 
        { module: 'auth' }, 
        { email: sanitizedEmail, remainingMinutes: minutesLeft }
      );
      
      toast({
        title: "Conta temporariamente bloqueada",
        description: `Muitas tentativas incorretas. Tente novamente em ${minutesLeft} minutos.`,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    logger.debug("Login attempt with:", { module: 'auth' }, { email: sanitizedEmail });

    try {
      // Add CSRF token to login request
      const { success, error } = await signIn(sanitizedEmail, password, { csrfToken });
      
      if (success) {
        logger.info("Login successful via form", { module: 'auth' });
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo(a) de volta!"
        });
        // Reset failed attempts counter
        resetFailedAttempts(sanitizedEmail);
        // Navigation will be handled by the useEffect that watches for user changes
      } else {
        logger.warn("Login failed:", { module: 'auth' }, { email: sanitizedEmail, error });
        handleError(new Error(error || "Falha no login. Verifique suas credenciais."));
        toast({
          title: "Erro ao fazer login",
          description: error || "Verifique suas credenciais e tente novamente",
          variant: "destructive"
        });
        
        // Register failed attempt
        const failStatus = registerFailedAttempt(sanitizedEmail);
        if (failStatus.attemptsLeft > 0) {
          toast({
            title: "Aviso de segurança",
            description: `Você tem mais ${failStatus.attemptsLeft} tentativa(s) restante(s)`,
            variant: "warning"
          });
        }
      }
    } catch (error: any) {
      logger.error("Exception during login:", { module: 'auth' }, error);
      handleError(error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive"
      });
      
      // Register failed attempt
      registerFailedAttempt(sanitizedEmail);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    user,
    handleSubmit,
    clearError
  };
}
