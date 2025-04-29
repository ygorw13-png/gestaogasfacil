import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { User } from '@supabase/supabase-js';

// Define a type for user metadata
interface UserWithMetadata {
  email?: string;
  user_metadata?: {
    email?: string;
    name?: string;
  };
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verificar se o email já está registrado
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error("Erro ao verificar usuários:", listError);
      } else if (existingUsers?.users && Array.isArray(existingUsers.users)) {
        // Check for existing user with this email
        const userExists = existingUsers.users.some((user: UserWithMetadata) => {
          // Safe check if user has email
          if (user && user.email) {
            return user.email === email;
          }
          
          // Safe check for user metadata
          if (user && user.user_metadata && typeof user.user_metadata === 'object') {
            return user.user_metadata.email === email;
          }
          
          return false;
        });
        
        if (userExists) {
          throw new Error("Este email já está registrado. Por favor, faça login ou use outro email.");
        }
      }

      // 2. Registrar o usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name // Salvar o nome nos metadados do usuário
          }
        }
      });

      if (authError) throw authError;
      
      if (authData?.user) {
        // 3. Criar o perfil do usuário e organização usando a RPC function
        const { error: profileError } = await supabase.functions.invoke('create_profile', {
          body: {
            user_id: authData.user.id,
            name
          }
        });

        if (profileError) throw profileError;

        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Por favor, verifique seu e-mail para confirmar o cadastro."
        });
        
        navigate('/login');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer cadastro",
        description: error.message,
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
          <p className="text-sm text-gray-600">Crie sua conta para acessar o sistema</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input 
                id="name"
                type="text" 
                placeholder="Nome completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-green-100 focus:border-green-500"
                disabled={loading}
                required 
              />
            </div>
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
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
