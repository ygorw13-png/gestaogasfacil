import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dataOperacional } from "@/lib/dataOperacional";
import { dataEntrega, numeroPedido } from "@/lib/entregas";

/**
 * Aviso curto no balcão: as entregas ficam centralizadas em Pedidos (o antigo quadro
 * "Entregas pendentes de dias anteriores" com "Dar baixa" saiu daqui).
 */
export function EntregasAbertasAviso() {
  const { data } = useQuery({
    queryKey: ["entregas-abertas-aviso"],
    refetchInterval: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("orders").select("id, created_at, entrega_prevista")
        .in("origem_venda", ["pedido", "online"]).not("status", "in", "(completed,delivered,cancelled)");
      if (error) throw error;
      const hoje = dataOperacional();
      const linhas = (data ?? []) as { id: string; created_at: string; entrega_prevista: string | null }[];
      const atrasadas = linhas.filter((o) => dataEntrega(o.entrega_prevista, o.created_at) < hoje);
      const deHoje = linhas.filter((o) => dataEntrega(o.entrega_prevista, o.created_at) === hoje);
      return { atrasadas, deHoje: deHoje.length };
    },
  });
  if (!data || (data.atrasadas.length === 0 && data.deHoje === 0)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
      <Truck className="h-4 w-4 text-muted-foreground" />
      <span>Entregas em aberto: {data.deHoje} de hoje{data.atrasadas.length > 0 ? `, ${data.atrasadas.length} atrasada(s)` : ""}.</span>
      {data.atrasadas.slice(0, 4).map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="font-mono text-xs text-primary underline">{numeroPedido(o.id)}</Link>
      ))}
      <Link to={data.atrasadas.length > 0 ? "/orders?filtro=atrasadas" : "/orders"} className="ml-auto inline-flex min-h-11 items-center px-1 text-primary underline">Ver em Pedidos</Link>
    </div>
  );
}
