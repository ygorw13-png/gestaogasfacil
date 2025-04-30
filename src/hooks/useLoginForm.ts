
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

  // Limpar erros quando o componente é montado ou desmontado
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (user) {
      logger.debug("Login page - Usuário já autenticado, redirecionando", { module: 'auth', user: user.id });
      
      // Redirecionar para página anterior se disponível, caso contrário para o dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (email: string, password: string, csrfToken?: string) => {
    setLoading(true);
    clearError();
    
    // Sanitizar entradas para prevenir XSS
    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    
    // Verificar proteção contra força bruta
    const loginStatus = checkLoginStatus(sanitizedEmail);
    if (loginStatus.blocked) {
      const minutesLeft = loginStatus.blockExpiresAt 
        ? Math.ceil((loginStatus.blockExpiresAt - Date.now()) / (60 * 1000))
        : 15;
      
      logger.warn("Tentativa de login bloqueada por excesso de tentativas", 
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

    logger.debug("Tentativa de login com:", { module: 'auth' }, { email: sanitizedEmail });

    try {
      // Adicionar token CSRF na requisição de login
      const { success, error } = await signIn(sanitizedEmail, password, { csrfToken });
      
      if (success) {
        logger.info("Login realizado com sucesso via formulário", { module: 'auth' });
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo(a) de volta!"
        });
        // Resetar contador de tentativas falhas
        resetFailedAttempts(sanitizedEmail);
        // A navegação será tratada pelo useEffect que observa a alteração do usuário
      } else {
        logger.warn("Falha no login:", { module: 'auth' }, { email: sanitizedEmail, error });
        handleError(new Error(error || "Falha no login. Verifique suas credenciais."));
        toast({
          title: "Erro ao fazer login",
          description: error || "Verifique suas credenciais e tente novamente",
          variant: "destructive"
        });
        
        // Registrar tentativa falha
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
      logger.error("Exceção no login:", { module: 'auth' }, error);
      handleError(error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive"
      });
      
      // Registrar tentativa falha
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
