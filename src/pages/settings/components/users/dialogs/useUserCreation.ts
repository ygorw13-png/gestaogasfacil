
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, roleLabels } from "@/types/userTypes";
import { validatePasswordStrength } from "@/utils/securityUtils";

interface UserCreationProps {
  organizationId: string | null;
  onUserCreated: (user: { id: string; name: string; role: UserRole }) => void;
  onClose: () => void;
}

export function useUserCreation({ 
  organizationId, 
  onUserCreated, 
  onClose 
}: UserCreationProps) {
  const { toast } = useToast();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  // Fix: Use string type for state to avoid TypeScript recursion issues
  const [newUserRole, setNewUserRole] = useState<string>('admin');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  // Função para validar a senha
  const validatePassword = (password: string) => {
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      setPasswordError(validation.message);
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleCreateNewUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword || !organizationId) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar força da senha
    if (!validatePassword(newUserPassword)) {
      return;
    }

    setCreatingUser(true);
    try {
      // Verificar se o e-mail já está em uso
      const { data: emailCheck, error: emailCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUserEmail);
      
      if (emailCheckError) throw emailCheckError;
      
      if (emailCheck && emailCheck.length > 0) {
        throw new Error("Este e-mail já está sendo usado por outro usuário");
      }

      // Registrar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            name: newUserName,
            organization_id: organizationId // Vincular ao ID da organização atual
          }
        }
      });

      if (authError) throw authError;
      
      if (authData?.user) {
        // Fix: Use proper JSON.stringify for the body
        const { error: profileError } = await supabase.functions.invoke('create_profile', {
          body: JSON.stringify({
            user_id: authData.user.id,
            name: newUserName,
            role: newUserRole as UserRole,
            email: newUserEmail,
            created_by_admin: true,
            organization_id: organizationId
          })
        });

        if (profileError) throw profileError;

        // Explicit cast to UserRole to prevent infinite type recursion
        const userRole = newUserRole as UserRole;
        
        toast({
          title: "Usuário criado com sucesso!",
          description: `${newUserName} foi adicionado como ${roleLabels[userRole]}`
        });
        
        // Notificar o componente pai sobre o novo usuário
        onUserCreated({
          id: authData.user.id,
          name: newUserName,
          role: userRole
        });
        
        // Limpar os campos do formulário
        resetForm();
        
        // Fechar o diálogo
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const resetForm = () => {
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPassword('');
    setNewUserRole('admin');
    setPasswordError(null);
  };

  return {
    newUserEmail,
    setNewUserEmail,
    newUserName,
    setNewUserName,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    passwordError,
    setPasswordError,
    creatingUser,
    handleCreateNewUser
  };
}
