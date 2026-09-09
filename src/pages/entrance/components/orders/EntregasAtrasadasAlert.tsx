import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/** Pedidos de dias anteriores que ficaram pendentes/em rota com o entregador */
export function useEntregasPendentesAntigas() {
  return useQuery({
    queryKey: ["entregas-pendentes-antigas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, client_name, product, quantity, price, status, delivery_person, created_at")
        .in("status", ["pending", "assigned", "in-progress"])
        .lt("created_at", startOfToday())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
  });
}

export function EntregasAtrasadasAlert() {
  const { data: pendentes = [] } = useEntregasPendentesAntigas();
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["entregas-pendentes-antigas"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["my-deliveries"] });
  };

  const baixar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed", delivered_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Entrega concluída", description: "Pedido marcado como entregue." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const devolver = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "pending", delivery_person: null, accepted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Pedido liberado", description: "Voltou para a fila para outro entregador." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (pendentes.length === 0) return null;

  return (
    <Card className="border-destructive border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Entregas pendentes de dias anteriores ({pendentes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendentes.map((o: any) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{o.client_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.product ?? "-"} ({o.quantity ?? 1}) · R${" "}
                {Number(o.price ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{o.status === "in-progress" ? "Em rota" : "Não aceita"}</Badge>
              <Button size="sm" variant="outline" onClick={() => devolver.mutate(o.id)} disabled={devolver.isPending}>
                <RotateCcw className="mr-1 h-3 w-3" /> Reatribuir
              </Button>
              <Button size="sm" onClick={() => baixar.mutate(o.id)} disabled={baixar.isPending}>
                <Check className="mr-1 h-3 w-3" /> Dar baixa
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
