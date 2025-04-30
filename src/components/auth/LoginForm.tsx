import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';

// Schema de validação para o formulário de login
const loginSchema = z.object({
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  csrfToken?: string; // Adicionando a propriedade csrfToken como opcional
}

export default function LoginForm({ onSubmit, loading, error, csrfToken }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const location = useLocation();
  const navigate = useNavigate();

  // Se houver um estado de redirecionamento anterior, use-o após o login bem-sucedido
  useEffect(() => {
    if (location.state?.from) {
      console.log("Redirecionamento após login será para:", location.state.from);
    }
  }, [location]);

  const validateForm = (): boolean => {
    try {
      loginSchema.parse({ email, password });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
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
    
    // Validação de entrada
    if (!validateForm()) {
      return;
    }
    
    // Sanitizando entradas
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password;
    
    try {
      await onSubmit(sanitizedEmail, sanitizedPassword);
      // O redirecionamento é gerenciado pelo AuthContext após login bem-sucedido
    } catch (error) {
      console.error("Erro ao processar login:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-green-100">
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
        
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulário de login">
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
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500 mt-1" id="email-error">{validationErrors.email}</p>
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
              minLength={6}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-500 mt-1" id="password-error">{validationErrors.password}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            disabled={loading}
            aria-busy={loading}
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
  );
}
