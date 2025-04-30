
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn } = useAuth();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (user) {
      console.log("Login page - User already authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    console.log("Attempting login with:", email);

    try {
      const { success, error } = await signIn(email, password);
      
      if (success) {
        console.log("Login successful via form");
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo(a) de volta!"
        });
        // A navegação será tratada pelo useEffect
      } else {
        console.error("Login failed:", error);
        setError(error || "Falha no login. Verifique suas credenciais.");
        toast({
          title: "Erro ao fazer login",
          description: error || "Verifique suas credenciais e tente novamente",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Login exception:", error);
      setError(error.message || "Verifique suas credenciais e tente novamente");
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
        error={error}
      />
    </div>
  );
}
