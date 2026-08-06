import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export type UserRole = "admin" | "gerente" | "portaria" | "entregador" | "user";

/**
 * Detecta o papel principal do usuário lendo profiles.role.
 * Admins podem alterar via configurações para 'entregador'.
 */
export function useUserRole() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const role = (query.data?.role ?? "admin") as UserRole;

  // Página inicial de acordo com o papel do usuário
  const homePath =
    role === "entregador"
      ? "/entregador/entregas"
      : role === "portaria"
      ? "/entrance"
      : "/dashboard";

  return {
    role,
    name: query.data?.name,
    isEntregador: role === "entregador",
    isPortaria: role === "portaria",
    isAdmin: role === "admin",
    homePath,
    isLoading: query.isLoading,
  };
}
