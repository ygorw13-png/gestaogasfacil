
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { sanitizeHtml } from '@/utils/securityUtils';
import { useCsrfProtection } from '@/utils/csrfProtection';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler({ toastOnError: false });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, signIn } = useAuth();
  const { csrfToken } = useCsrfProtection();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (user) {
      console.log("Login page - Usuário já autenticado, redirecionando");
      
      // Redirecionar para página anterior se disponível, caso contrário para o dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Limpar erros quando o componente é montado ou desmontado
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (email: string, password: string) => {
    setLoading(true);
    clearError();
    
    // Sanitizar entradas para prevenir XSS
    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    
    console.log("Tentativa de login com:", sanitizedEmail);

    try {
      // Adicionar token CSRF na requisição de login
      const { success, error } = await signIn(sanitizedEmail, password, { csrfToken });
      
      if (success) {
        console.log("Login realizado com sucesso via formulário");
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo(a) de volta!"
        });
        // A navegação será tratada pelo useEffect que observa a alteração do usuário
      } else {
        console.error("Falha no login:", error);
        handleError(new Error(error || "Falha no login. Verifique suas credenciais."));
        toast({
          title: "Erro ao fazer login",
          description: error || "Verifique suas credenciais e tente novamente",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Exceção no login:", error);
      handleError(error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário já estiver logado, não renderizar o formulário
  if (user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-b from-green-50 to-white">
      <LoginForm 
        onSubmit={handleSubmit}
        loading={loading}
        error={error?.message || null}
        csrfToken={csrfToken}
      />
    </div>
  );
}
