import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

/** Administrador conferido no banco (user_roles). Só decide o que a tela mostra; o banco é quem bloqueia. */
export function useEhAdmin() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["eh-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) return false;
      return data === true;
    },
  });
  return { ehAdmin: q.data === true, carregando: q.isLoading };
}
