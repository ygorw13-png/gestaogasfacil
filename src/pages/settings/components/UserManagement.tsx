
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/userTypes";
import { customTables } from "@/integrations/supabase/customClient";
import { DbProfile } from "@/types/supabaseTypes";
import { useAuth } from "@/contexts/AuthContext";
import { UserList } from "./users/UserList";
import { NewUserDialog } from "./users/NewUserDialog";

export function UserManagement() {
  const { toast } = useToast();
  const { user, organization } = useAuth();
  const [users, setUsers] = useState<Array<{id: string, name: string, role: UserRole}>>([]);
  const [loading, setLoading] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

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

  const handleUserCreated = (newUser: {id: string, name: string, role: UserRole}) => {
    setUsers([...users, newUser]);
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
        <UserList 
          users={users} 
          loading={loading} 
          onAddUserClick={() => setIsNewUserDialogOpen(true)}
        />
        
        <NewUserDialog
          open={isNewUserDialogOpen}
          onOpenChange={setIsNewUserDialogOpen}
          onUserCreated={handleUserCreated}
          organizationId={organization?.id || null}
        />
      </CardContent>
    </Card>
  );
}
