
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserRole, roleLabels } from "@/types/userTypes";
import { customTables } from "@/integrations/supabase/customClient";
import { DbProfile } from "@/types/supabaseTypes";

export function UserManagement() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendedor');
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<Array<{id: string, name: string, role: UserRole}>>([]);
  const [loading, setLoading] = useState(false);

  // Carregar usuários do sistema
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await customTables.profiles.select();

        if (error) {
          throw error;
        }
        
        if (data) {
          // Fix the type issue by properly handling data as an array
          const profiles = data as unknown as DbProfile[];
          
          if (Array.isArray(profiles)) {
            // Convert from DbProfile to our internal user format
            setUsers(profiles.map(profile => ({
              id: profile.id,
              name: profile.name,
              role: profile.role as UserRole
            })));
          }
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
  }, [toast]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Configure permissões de acesso para usuários do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Permissões de Usuário</h2>
          
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
      </CardContent>
    </Card>
  );
}
