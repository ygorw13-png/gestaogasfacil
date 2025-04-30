
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleLabels } from "@/types/userTypes";
import { customTables } from "@/integrations/supabase/customClient";

interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface UserListProps {
  users: User[];
  loading: boolean;
  onAddUserClick: () => void;
}

export function UserList({ users, loading, onAddUserClick }: UserListProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendedor');

  const handleUpdateRole = async () => {
    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário para atualizar",
        variant: "destructive"
      });
      return;
    }
    
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
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Usuários da sua Organização</h2>
        <Button onClick={onAddUserClick}>Adicionar Usuário</Button>
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
    </div>
  );
}
