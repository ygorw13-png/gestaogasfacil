import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Bike, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEntregadoresLocalizacoes } from "@/hooks/useEntregadorLocation";
import { formatAddress, mapsRouteUrl, mapsCoordUrl } from "@/utils/mapsLinks";
import { tipoVendaShort } from "@/lib/saleTypes";

const statusLabel: Record<string, string> = {
  pending: "Aguardando",
  assigned: "Atribuída",
  "in-progress": "Aceita / em rota",
  completed: "Entregue",
};

function minutosAtras(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function OrdersMap() {
  const { data: locais = [], refetch, isFetching } = useEntregadoresLocalizacoes();

  const { data: entregas = [] } = useQuery({
    queryKey: ["entregas-em-rota"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, client_name, address, product, quantity, price, status, delivery_person, tipo_venda, created_at")
        .in("status", ["pending", "assigned", "in-progress"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: nomes = {} } = useQuery({
    queryKey: ["profiles-nomes"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, name");
      return Object.fromEntries((data ?? []).map((p: any) => [p.id, p.name])) as Record<string, string>;
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Bike className="h-5 w-5" /> Entregadores no mapa</CardTitle>
            <CardDescription>Posição atualizada sempre que o entregador abre o app</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {locais.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma localização registrada ainda.
            </p>
          ) : (
            locais.map((l) => (
              <div key={l.user_id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">{l.nome || nomes[l.user_id] || "Entregador"}</p>
                  <p className="text-xs text-muted-foreground">
                    Atualizado há {minutosAtras(l.updated_at)} min
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={mapsCoordUrl(l.latitude, l.longitude)} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4 mr-1" /> Ver no Maps
                  </a>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entregas em aberto ({entregas.length})</CardTitle>
          <CardDescription>Clique em "Rota" para abrir a navegação no Google Maps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {entregas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma entrega em aberto.</p>
          ) : (
            entregas.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{o.client_name}</p>
                    <Badge variant={o.status === "in-progress" ? "default" : "secondary"}>
                      {statusLabel[o.status] ?? o.status}
                    </Badge>
                    <Badge variant="outline">{tipoVendaShort(o.tipo_venda)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatAddress(o.address) || "Endereço não informado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.product} ({o.quantity}) • {o.delivery_person ? nomes[o.delivery_person] ?? "Entregador" : "Sem entregador"}
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={mapsRouteUrl(o.address)} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-4 w-4 mr-1" /> Rota
                  </a>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
