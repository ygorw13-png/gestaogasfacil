
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/userTypes';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUserData, user } = useAuth();
  
  // Se o usuário já está logado, redirecionar para o dashboard
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (user) {
        // Buscar o perfil do usuário com a role usando a função RPC
        const { data, error: profileError } = await supabase.functions.invoke('get_user_profile', {
          body: { user_id: user.id }
        });

        if (profileError) {
          throw profileError;
        }

        if (data) {
          // Atualizar o contexto de autenticação com os dados do usuário
          updateUserData({
            id: user.id,
            name: data.name || user.user_metadata?.name || 'Usuário',
            role: data.role as UserRole
          });

          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo(a) ${data.name || user.user_metadata?.name || 'Usuário'}!`
          });
          
          // Redirecionar baseado na role
          switch (data.role) {
            case 'portaria':
              navigate('/entrance');
              break;
            case 'estoque':
              navigate('/inventory');
              break;
            case 'vendedor':
              navigate('/orders');
              break;
            case 'entregador':
              navigate('/routes');
              break;
            default:
              navigate('/dashboard'); // admin e gerente vão para o dashboard
          }
        }
      }
    } catch (error: any) {
      console.error("Erro de login:", error);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold text-green-800">GasFlow Aqua</CardTitle>
          <p className="text-sm text-gray-600">Faça login para acessar o sistema</p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="E-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-green-100 focus:border-green-500"
                disabled={loading}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-green-100 focus:border-green-500"
                disabled={loading}
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700 hover:underline">
              Cadastre-se
            </Link>
          </p>
          <Link 
            to="/reset-password" 
            className="text-sm text-gray-600 hover:text-green-600 hover:underline"
          >
            Esqueceu sua senha?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
