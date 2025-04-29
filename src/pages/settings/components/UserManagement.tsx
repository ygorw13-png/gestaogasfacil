import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleLabels } from "@/types/userTypes";
import { customTables } from "@/integrations/supabase/customClient";
import { DbProfile } from "@/types/supabaseTypes";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Define a type for user metadata
interface UserWithMetadata {
  email?: string;
  user_metadata?: {
    email?: string;
    name?: string;
  };
}

export function UserManagement() {
  const { toast } = useToast();
  const { user, organization } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendedor');
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<Array<{id: string, name: string, role: UserRole}>>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para o diálogo de criação de novo usuário
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('vendedor');
  const [creatingUser, setCreatingUser] = useState(false);

  // Carregar usuários da mesma organização
  useEffect(() => {
    const fetchUsers = async () => {
      if (!organization) return;
      
      setLoading(true);
      try {
        const { data, error } = await customTables.profiles.selectByOrganization(organization.id);

        if (error) {
          throw error;
        }
        
        if (data && Array.isArray(data)) {
          // Convert from DbProfile to our internal user format
          setUsers(data.map((profile: DbProfile) => ({
            id: profile.id,
            name: profile.name,
            role: profile.role as UserRole
          })));
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast, organization]);

  const handleUpdateRole = async () => {
    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário para atualizar",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await customTables.profiles.update({ 
        id: selectedUserId,
        role: selectedRole
      });
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Permissão atualizada para ${roleLabels[selectedRole]}`
      });
      
      // Atualizar a lista
      setUsers(users.map(u => 
        u.id === selectedUserId 
          ? {...u, role: selectedRole} 
          : u
      ));
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword || !organization) {
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
            organization_id: organization.id
          }
        });

        if (profileError) throw profileError;

        toast({
          title: "Usuário criado com sucesso!",
          description: `${newUserName} foi adicionado como ${roleLabels[newUserRole]}`
        });
        
        // Adicionar o novo usuário à lista
        setUsers([...users, {
          id: authData.user.id,
          name: newUserName,
          role: newUserRole
        }]);
        
        // Fechar o diálogo e limpar os campos
        setIsNewUserDialogOpen(false);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPassword('');
        setNewUserRole('vendedor');
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
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Configure permissões de acesso para usuários do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Usuários da sua Organização</h2>
          <Button onClick={() => setIsNewUserDialogOpen(true)}>Adicionar Usuário</Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Selecione um usuário</label>
            <Select 
              value={selectedUserId} 
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({roleLabels[user.role as UserRole]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nível de acesso</label>
            <Select 
              value={selectedRole} 
              onValueChange={(value: UserRole) => setSelectedRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um nível de acesso" />
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
          
          <Button onClick={handleUpdateRole} disabled={loading || !selectedUserId}>
            {loading ? "Atualizando..." : "Atualizar Permissão"}
          </Button>
        </div>

        {/* Dialog para adicionar novo usuário */}
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
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
              <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateNewUser} disabled={creatingUser}>
                {creatingUser ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
