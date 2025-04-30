
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RegisterFormData, ValidationErrors } from '@/types/authTypes';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  loading: boolean;
  validationErrors: ValidationErrors;
}

export default function RegisterForm({ onSubmit, loading, validationErrors }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, password, confirmPassword });
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor, corrija os erros no formulário antes de continuar.
          </AlertDescription>
        </Alert>
      )}

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
          A senha deve ter pelo menos 8 caracteres, incluir uma letra maiúscula, um número e um caractere especial.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input 
          id="confirmPassword"
          type="password" 
          placeholder="Confirme sua senha" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`border-green-100 focus:border-green-500 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
          disabled={loading}
          required 
        />
        {validationErrors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700 text-white" 
        disabled={loading}
      >
        {loading ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
}
