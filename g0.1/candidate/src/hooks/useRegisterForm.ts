
import { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { validatePasswordStrength } from '@/utils/securityUtils';
import { sanitizeHtml } from '@/utils/securityUtils';
import { logger } from '@/utils/logger';
import { RegisterFormData, ValidationErrors } from '@/types/authTypes';
import { signUpWithEmail } from '@/contexts/auth';

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

// Define a type for user metadata
interface UserWithMetadata {
  email?: string;
  user_metadata?: {
    email?: string;
    name?: string;
  };
}

export function useRegisterForm() {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = (data: RegisterFormData): boolean => {
    try {
      // Validar campos básicos
      registerSchema.parse(data);
      
      // Validação adicional para confirmar senha
      if (data.password !== data.confirmPassword) {
        setValidationErrors({...validationErrors, confirmPassword: 'As senhas não coincidem'});
        return false;
      }
      
      // Validar força da senha
      const passwordCheck = validatePasswordStrength(data.password);
      if (!passwordCheck.valid) {
        setValidationErrors({...validationErrors, password: passwordCheck.message});
        return false;
      }
      
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationErrors = {};
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

  const handleRegister = async (data: RegisterFormData) => {
    if (!validateForm(data)) {
      return;
    }
    
    setLoading(true);

    try {
      // Sanitize inputs
      const sanitizedName = sanitizeHtml(data.name.trim());
      const sanitizedEmail = sanitizeHtml(data.email.trim().toLowerCase());

      // Primeiro registrar o usuário
      const { success, error: authError, user } = await signUpWithEmail(
        sanitizedEmail,
        data.password,
        { name: sanitizedName }
      );

      if (!success || authError || !user) {
        throw new Error(authError || "Não foi possível concluir o cadastro.");
      }
      // The existing signup trigger is the sole initial provisioning path.
      toast({ title: "Solicitação de cadastro concluída", description: "Se solicitada, confirme seu e-mail antes de entrar." });
      navigate('/login');
    } catch (backupError) {
            console.error("Erro na abordagem de backup:", backupError);
            // Mesmo com erro no backup, continuamos para tentar permitir login
          }
        }

        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Por favor, faça login com suas credenciais."
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

  return {
    loading,
    validationErrors,
    handleRegister
  };
}
