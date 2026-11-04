
import { Users, User, ShieldCheck, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Contagem real de perfis da organização por papel. */
function useUsersByRole() {
  return useQuery({
    queryKey: ["admin", "users-by-role"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("role, ativo");
      if (error) throw error;
      const rows = data || [];
      const active = rows.filter((p) => p.ativo !== false);
      return {
        total: active.length,
        admin: active.filter((p) => p.role === "admin").length,
        entregador: active.filter((p) => p.role === "entregador").length,
        user: active.filter((p) => p.role === "user").length,
      };
    },
    refetchInterval: 60_000,
  });
}

export function UsersOverview() {
  const { data, isLoading, isError } = useUsersByRole();

  const renderCount = (value?: number) =>
    isLoading ? "..." : isError ? "—" : String(value ?? 0);

  return (
    <Card className="border-purple-100">
      <CardHeader className="p-4 bg-purple-50/50">
        <CardTitle className="text-base">Usuários Ativos</CardTitle>
        <CardDescription>
          {isLoading
            ? "Carregando usuários..."
            : isError
              ? "Não foi possível consultar os usuários"
              : `Total de ${data?.total ?? 0} usuários ativos na organização`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              <span>Administradores</span>
            </div>
            <span className="text-sm font-medium">{renderCount(data?.admin)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-500" />
              <span>Entregadores</span>
            </div>
            <span className="text-sm font-medium">{renderCount(data?.entregador)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              <span>Demais usuários</span>
            </div>
            <span className="text-sm font-medium">{renderCount(data?.user)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
