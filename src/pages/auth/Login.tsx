
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'gerente' | 'portaria' | 'estoque' | 'vendedor' | 'entregador';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUserData } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (user) {
        // Buscar o perfil do usuário com a role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (profile) {
          // Atualizar o contexto de autenticação com os dados do usuário
          updateUserData({
            id: user.id,
            name: profile.name,
            role: profile.role as UserRole
          });

          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo(a) ${profile.name}!`
          });
          
          // Redirecionar baseado na role
          switch (profile.role) {
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
              navigate('/'); // admin e gerente vão para o dashboard
          }
        }
      }
    } catch (error: any) {
      console.error("Erro de login:", error);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input 
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
              <Input 
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
