
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/userTypes";
import { customTables } from "@/integrations/supabase/customClient";
import { DbProfile } from "@/types/supabaseTypes";
import { useAuth } from "@/contexts/AuthContext";
import { UserList } from "./users/UserList";
import { NewUserDialog } from "./users/NewUserDialog";
import { useUserManagement } from "./users/hooks/useUserManagement";

export function UserManagement() {
  const { organization } = useAuth();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const { users, loading, addUser } = useUserManagement(organization?.id);

  const handleUserCreated = (newUser: {id: string, name: string, role: UserRole}) => {
    addUser(newUser);
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
