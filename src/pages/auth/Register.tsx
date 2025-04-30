
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define a type for user metadata
interface UserWithMetadata {
  email?: string;
  user_metadata?: {
    email?: string;
    name?: string;
  };
}

// Schema de validação para o formulário de registro
const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
});

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = (): boolean => {
    try {
      registerSchema.parse({ name, email, password });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { name?: string; email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') errors.name = err.message;
          if (err.path[0] === 'email') errors.email = err.message;
          if (err.path[0] === 'password') errors.password = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Sanitize inputs
      const sanitizedName = name.trim();
      const sanitizedEmail = email.trim().toLowerCase();

      // 1. Verificar se o email já está registrado
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error("Erro ao verificar usuários:", listError);
      } else if (existingUsers?.users && Array.isArray(existingUsers.users)) {
        // Check for existing user with this email
        const userExists = existingUsers.users.some((user: UserWithMetadata) => {
          // Safe check if user has email
          if (user && user.email) {
            return user.email === sanitizedEmail;
          }
          
          // Safe check for user metadata
          if (user && user.user_metadata && typeof user.user_metadata === 'object') {
            return user.user_metadata.email === sanitizedEmail;
          }
          
          return false;
        });
        
        if (userExists) {
          throw new Error("Este email já está registrado. Por favor, faça login ou use outro email.");
        }
      }

      // 2. Registrar o usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            name: sanitizedName // Salvar o nome nos metadados do usuário
          }
        }
      });

      if (authError) throw authError;
      
      if (authData?.user) {
        // 3. Criar o perfil do usuário e organização usando a RPC function
        const { error: profileError } = await supabase.functions.invoke('create_profile', {
          body: {
            user_id: authData.user.id,
            name: sanitizedName
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
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor, corrija os erros no formulário antes de continuar.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input 
                id="name"
                type="text" 
                placeholder="Nome completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border-green-100 focus:border-green-500 ${validationErrors.name ? 'border-red-500' : ''}`}
                disabled={loading}
                required 
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="E-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`border-green-100 focus:border-green-500 ${validationErrors.email ? 'border-red-500' : ''}`}
                disabled={loading}
                required 
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`border-green-100 focus:border-green-500 ${validationErrors.password ? 'border-red-500' : ''}`}
                disabled={loading}
                required 
              />
              {validationErrors.password && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                A senha deve ter pelo menos 8 caracteres, incluir uma letra maiúscula e um número.
              </p>
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
