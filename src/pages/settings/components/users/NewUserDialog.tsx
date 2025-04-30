
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleLabels } from "@/types/userTypes";
import { supabase } from "@/integrations/supabase/client";
import { validatePasswordStrength, generateSecurePassword } from "@/utils/securityUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define a type for user metadata
interface UserWithMetadata {
  email?: string;
  user_metadata?: {
    email?: string;
    name?: string;
  };
}

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: { id: string; name: string; role: UserRole }) => void;
  organizationId: string | null;
}

export function NewUserDialog({ 
  open, 
  onOpenChange,
  onUserCreated,
  organizationId
}: NewUserDialogProps) {
  const { toast } = useToast();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('vendedor');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Função para gerar senha aleatória segura
  const handleGeneratePassword = () => {
    const securePassword = generateSecurePassword();
    setNewUserPassword(securePassword);
    setPasswordError(null);
  };

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
        // Criar o perfil do usuário usando a função RPC, vinculando à organização atual
        const { error: profileError } = await supabase.functions.invoke('create_profile', {
          body: {
            user_id: authData.user.id,
            name: newUserName,
            role: newUserRole,
            email: newUserEmail,
            created_by_admin: true,
            organization_id: organizationId
          }
        });

        if (profileError) throw profileError;

        toast({
          title: "Usuário criado com sucesso!",
          description: `${newUserName} foi adicionado como ${roleLabels[newUserRole]}`
        });
        
        // Notificar o componente pai sobre o novo usuário
        onUserCreated({
          id: authData.user.id,
          name: newUserName,
          role: newUserRole
        });
        
        // Limpar os campos do formulário
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPassword('');
        setNewUserRole('vendedor');
        setPasswordError(null);
        
        // Fechar o diálogo
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário para sua organização. Todos os usuários terão acesso apenas aos dados da sua organização.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Senha
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text" // Mostrar a senha para facilitar compartilhamento
                  value={newUserPassword}
                  onChange={(e) => {
                    setNewUserPassword(e.target.value);
                    if (e.target.value) validatePassword(e.target.value);
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGeneratePassword}
                  className="whitespace-nowrap"
                >
                  Gerar Senha
                </Button>
              </div>
              
              {passwordError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{passwordError}</AlertDescription>
                </Alert>
              )}
              
              <p className="text-xs text-gray-500">
                A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Função
            </Label>
            <Select 
              value={newUserRole} 
              onValueChange={(value: UserRole) => setNewUserRole(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="portaria">Portaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateNewUser} disabled={creatingUser}>
            {creatingUser ? "Criando..." : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
