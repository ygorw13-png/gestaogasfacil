
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Create schema for new user form
const userFormSchema = z.object({
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().min(1, 'Função é obrigatória'),
  department: z.string().optional(),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export function useUserCreation() {
  const [errors, setErrors] = useState<string | null>(null);
  const [isCreateUserLoading, setIsCreateUserLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      name: '',
      role: '',
      department: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleCreateUser = async (values: UserFormValues) => {
    try {
      setIsCreateUserLoading(true);
      setErrors(null);

      // Aqui seria integrado com Supabase para criar o usuário
      console.log('Creating user:', values);
      
      // Simulação de uma requisição bem-sucedida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Usuário criado",
        description: `${values.name} foi adicionado com sucesso.`,
      });
      
      form.reset();
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      setErrors(error.message || 'Falha ao criar usuário');
      return false;
    } finally {
      setIsCreateUserLoading(false);
    }
  };

  const clearForm = () => {
    form.reset();
    setErrors(null);
  };

  return {
    form,
    isCreateUserLoading,
    errors,
    handleCreateUser,
    clearForm
  };
}
