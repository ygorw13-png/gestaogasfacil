
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
  const [newUserRole, setNewUserRole] = useState<UserRole>('vendedor');
  const [creatingUser, setCreatingUser] = useState(false);

  const handleCreateNewUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword || !organizationId) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setCreatingUser(true);
    try {
      // 1. Verificar se o e-mail já está em uso
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error("Erro ao verificar usuários:", listError);
      } else if (existingUsers?.users && Array.isArray(existingUsers.users)) {
        // Check for existing user with this email
        const userExists = existingUsers.users.some((user: UserWithMetadata) => {
          // Safe check if user has email
          if (user && user.email) {
            return user.email === newUserEmail;
          }
          
          // Safe check for user metadata
          if (user && user.user_metadata && typeof user.user_metadata === 'object') {
            return user.user_metadata.email === newUserEmail;
          }
          
          return false;
        });
        
        if (userExists) {
          throw new Error("Este e-mail já está em uso");
        }
      }

      // 2. Registrar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            name: newUserName
          }
        }
      });

      if (authError) throw authError;
      
      if (authData?.user) {
        // 3. Criar o perfil do usuário usando a função RPC, vinculando à organização atual
        const { error: profileError } = await supabase.functions.invoke('create_profile', {
          body: {
            user_id: authData.user.id,
            name: newUserName,
            role: newUserRole,
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
            Crie um novo usuário para sua organização.
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
            <Input
              id="password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="col-span-3"
            />
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
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="entregador">Entregador</SelectItem>
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
