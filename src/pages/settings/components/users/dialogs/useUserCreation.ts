
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserFormData } from '@/pages/entrance/types/cashierTypes';

export const useUserCreation = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("vendedor");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validatePassword = (password: string, confirmPassword: string): boolean => {
    if (password !== confirmPassword) {
      toast({
        title: "As senhas não coincidem",
        description: "Por favor, digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      setPasswordError("As senhas não coincidem");
      return false;
    }
    
    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      setPasswordError("A senha deve ter pelo menos 8 caracteres");
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  const handleCreateNewUser = (onSuccess?: () => void) => {
    if (!validatePassword(newUserPassword, newUserConfirmPassword)) {
      return;
    }
    
    createUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      password: newUserPassword,
      confirmPassword: newUserConfirmPassword
    }).then(result => {
      if (result?.success && onSuccess) {
        // Reset form values
        setNewUserEmail("");
        setNewUserName("");
        setNewUserPassword("");
        setNewUserConfirmPassword("");
        setNewUserRole("vendedor");
        
        // Call success callback
        onSuccess();
      }
    });
  };

  const createUser = async (userData: UserFormData) => {
    if (!validatePassword(userData.password, userData.confirmPassword)) {
      return { success: false };
    }
    
    setIsLoading(true);
    
    try {
      // Simular criação do usuário
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Usuário criado",
        description: `${userData.name} foi adicionado como ${userData.role}.`,
      });
      
      return { 
        success: true, 
        user: { 
          ...userData, 
          id: 'new-user-id' 
        } 
      };
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
    newUserEmail,
    setNewUserEmail,
    newUserName,
    setNewUserName,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    passwordError,
    creatingUser: isLoading,
    handleCreateNewUser
  };
};
