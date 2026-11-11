import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { hojePortaria } from "@/lib/g1/dataPortaria";
import { G1_ACOES } from "@/lib/g1/acoes";
import { AcertoControlado } from "./components/acerto/AcertoControlado";

interface AcertoRow {
  delivery_person: string;
  entregador_nome: string;
  qtd: number;
  total_dinheiro: number;
  total_pix: number;
  total_cartao: number;
  total: number;
}

function classifyPayment(method: string | null): "dinheiro" | "pix" | "cartao" | "outro" {
  if (!method) return "outro";
  const m = method.toLowerCase();
  if (m.includes("dinheiro")) return "dinheiro";
  if (m.includes("pix")) return "pix";
  if (m.includes("cart") || m.includes("crédito") || m.includes("credito") || m.includes("débito") || m.includes("debito")) return "cartao";
  return "outro";
}

/** Resumo antigo por pedidos (G1 desligado): não é acerto registrado. */
function ResumoPorPedidos() {
  const today = hojePortaria();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["acerto-entregadores", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("delivery_person, price, payment_method, status, delivered_at")
        .eq("status", "completed")
        .gte("delivered_at", today + "T00:00:00")
        .not("delivery_person", "is", null);
      if (error) throw error;

      // Busca nomes
      const ids = Array.from(new Set((data ?? []).map(d => d.delivery_person).filter(Boolean) as string[]));
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, name").in("id", ids)
        : { data: [] };
      const nameMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

      const agg = new Map<string, AcertoRow>();
      for (const r of data ?? []) {
        const id = r.delivery_person as string;
        const valor = Number(r.price ?? 0);
        const cat = classifyPayment(r.payment_method);
        if (!agg.has(id)) {
          agg.set(id, {
            delivery_person: id,
            entregador_nome: nameMap.get(id) ?? "Entregador",
            qtd: 0, total_dinheiro: 0, total_pix: 0, total_cartao: 0, total: 0,
          });
        }
        const row = agg.get(id)!;
        row.qtd++;
        row.total += valor;
        if (cat === "dinheiro") row.total_dinheiro += valor;
        else if (cat === "pix") row.total_pix += valor;
        else if (cat === "cartao") row.total_cartao += valor;
      }
      return Array.from(agg.values());
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Acerto dos Entregadores</h1>
        <Badge variant="outline">{new Date().toLocaleDateString("pt-BR")}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> Prestação de contas do dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entregador</TableHead>
                <TableHead className="text-center">Entregas</TableHead>
                <TableHead className="text-right">Dinheiro</TableHead>
                <TableHead className="text-right">PIX</TableHead>
                <TableHead className="text-right">Cartão</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma entrega concluída hoje</TableCell></TableRow>
              ) : (
                rows.map(r => (
                  <TableRow key={r.delivery_person}>
                    <TableCell className="font-medium">{r.entregador_nome}</TableCell>
                    <TableCell className="text-center">{r.qtd}</TableCell>
                    <TableCell className="text-right">R$ {r.total_dinheiro.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {r.total_pix.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {r.total_cartao.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">R$ {r.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Resumo pela forma de pagamento combinada nos pedidos concluídos hoje. Não comprova recebimento e não
        registra o acerto. O destino de PIX e cartão (conta da empresa ou do entregador) ainda não foi definido.
      </p>
    </div>
  );
}

/**
 * Acerto dos entregadores. Com as ações controladas (G1), o acerto é registrado no banco (persistido,
 * auditável, sem duplicar); sem elas, mostra só o resumo antigo por pedidos.
 */
export default function AcertoEntregadores() {
  return G1_ACOES ? <AcertoControlado /> : <ResumoPorPedidos />;
}
