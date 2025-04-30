
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/userTypes";
import { customTables } from "@/integrations/supabase/customClient";
import { DbProfile } from "@/types/supabaseTypes";

type User = {
  id: string;
  name: string;
  role: UserRole;
};

export function useUserManagement(organizationId?: string) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar usuários da mesma organização
  useEffect(() => {
    const fetchUsers = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      try {
        const { data, error } = await customTables.profiles.selectByOrganization(organizationId);

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
  }, [toast, organizationId]);

  const addUser = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  return {
    users,
    loading,
    addUser
  };
}
