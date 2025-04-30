
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

type UserRole = "admin" | "gerente" | "vendedor" | "entregador";

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

export const useUserCreation = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string, confirmPassword: string): boolean => {
    if (password !== confirmPassword) {
      toast({
        title: "As senhas não coincidem",
        description: "Por favor, digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return false;
    }
    
    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const createUser = async (userData: UserFormData) => {
    if (!validatePassword(userData.password, userData.confirmPassword)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newUserRole = userData.role;
      
      // Simular criação do usuário
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Usuário criado",
        description: `${userData.name} foi adicionado como ${newUserRole}.`,
      });
      
      return { success: true, user: { ...userData, id: 'new-user-id' } };
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: "Ocorreu um erro ao tentar criar o usuário. Tente novamente.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createUser,
    isLoading,
  };
};
