
import { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

      if (!success || authError) {
        setValidationErrors({ password: authError || "Erro ao registrar usuário" });
        throw new Error(authError || "Erro ao registrar usuário");
      }

      
      if (user) {
        // Criar o perfil do usuário e organização usando a RPC function
        // Sem sessão (cadastro aguardando confirmação de e-mail) a função protegida não é chamada.
        const { data: { session: novaSessao } } = await supabase.auth.getSession();
        const { error: profileError } = !novaSessao ? { error: null } : await supabase.functions.invoke('create_profile', {
          body: {
            user_id: user.id,
            name: sanitizedName,
            role: 'admin', // Garantir que todos novos usuários sejam admin por padrão
            created_by_admin: false // Indica que é um auto-registro
          }
        });

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          // Abordagem de backup se a função falhar
          try {
            const { error: directError } = await supabase.from('profiles').insert({
              id: user.id,
              name: sanitizedName,
              role: 'admin' // Garantir que todos novos usuários sejam admin por padrão
            });
            
            if (directError) throw directError;
            
            // Criar uma organização para o usuário
            const { data: org, error: orgError } = await supabase.from('organizations').insert({
              name: `${sanitizedName}'s Organization`,
              owner_id: user.id
            }).select('id').single();
            
            if (orgError) throw orgError;
            
            // Atualizar o perfil com a organização
            const { error: updateError } = await supabase.from('profiles').update({
              organization_id: org.id
            }).eq('id', user.id);
            
            if (updateError) throw updateError;
            
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
