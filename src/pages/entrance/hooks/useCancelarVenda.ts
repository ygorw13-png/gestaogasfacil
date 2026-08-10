import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRegistrarMovimentacao, type PortariaProduto } from "./usePortariaStock";

const produtoFrom = (product?: string | null): PortariaProduto | null => {
  const p = (product || "").toUpperCase();
  if (p.includes("P13")) return "P13";
  if (p.includes("P20")) return "P20";
  if (p.includes("P45")) return "P45";
  if (p.includes("ÁGUA") || p.includes("AGUA")) return "agua";
  return null;
};

/** Cancela uma venda: marca o pedido como cancelado e estorna estoque e ficha do parceiro. */
export function useCancelarVenda() {
  const qc = useQueryClient();
  const registrarMov = useRegistrarMovimentacao();

  return useMutation({
    mutationFn: async ({ orderId, motivo }: { orderId: string; motivo: string }) => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (!order) throw new Error("Venda não encontrada");

      const o = order as any;
      const qty = Number(o.quantity) || 0;
      const isVasilhame = o.tipo_venda === "vasilhame";
      const produto = produtoFrom(o.product);
      const isComodato = o.has_empty_cylinder === false;

      // 1) Estorno do estoque da portaria
      if (isVasilhame) {
        await registrarMov.mutateAsync({
          tipo: "ajuste",
          produto: "P13",
          delta_cheios: 0,
          delta_vazios: qty,
          delta_emprestados: 0,
          cliente_id: o.client_id || null,
          cliente_nome: o.client_name || null,
          referencia_id: orderId,
          observacoes: `Cancelamento de venda - ${motivo}`,
        });
      } else if (produto) {
        await registrarMov.mutateAsync({
          tipo: "ajuste",
          produto,
          delta_cheios: qty,
          delta_vazios: isComodato ? 0 : -(Number(o.vasilhames_recebidos) || 0),
          delta_emprestados: isComodato ? -qty : 0,
          cliente_id: o.client_id || null,
          cliente_nome: o.client_name || null,
          referencia_id: orderId,
          observacoes: `Cancelamento de venda - ${motivo}`,
        });
      }

      // 2) Estorno na ficha do parceiro (agregado ou ponto de revenda)
      let parceiro: { tipo: "agregado" | "ponto"; id: string; nome: string } | null = null;
      if (o.reseller_id) {
        const { data: r } = await supabase
          .from("resellers")
          .select("id, name")
          .eq("id", o.reseller_id)
          .maybeSingle();
        if (r) parceiro = { tipo: "agregado", id: r.id, nome: r.name };
      }
      if (!parceiro && o.client_id) {
        const { data: p } = await supabase
          .from("pontos_revenda" as any)
          .select("id, nome")
          .eq("id", o.client_id)
          .maybeSingle();
        if (p) parceiro = { tipo: "ponto", id: (p as any).id, nome: (p as any).nome };
      }

      if (parceiro && !isVasilhame && qty > 0) {
        // Só estorna se existir uma entrega em aberto (ainda não estornada) para este parceiro
        const { data: entregas } = await supabase
          .from("conta_botijoes" as any)
          .select("id, quantidade, order_id")
          .eq("parceiro_id", parceiro.id)
          .eq("tipo", "entrega")
          .is("order_id", null)
          .eq("quantidade", qty)
          .order("created_at", { ascending: false })
          .limit(1);

        const entrega = (entregas as any[])?.[0];

        if (entrega) {
          // marca a entrega como vinculada a este pedido para não estornar duas vezes
          await supabase
            .from("conta_botijoes" as any)
            .update({ order_id: orderId } as any)
            .eq("id", entrega.id);

          await supabase.from("conta_botijoes" as any).insert({
            parceiro_tipo: parceiro.tipo,
            parceiro_id: parceiro.id,
            parceiro_nome: parceiro.nome,
            tipo: "ajuste",
            produto: produto ?? "P13",
            quantidade: -qty,
            vasilhames_recebidos: 0,
            data: new Date().toISOString().slice(0, 10),
            order_id: orderId,
            observacoes: `Cancelamento de venda - ${motivo}`,
          } as any);
        }
      }


      // 3) Cancela o pedido
      const { error: upErr } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          notes: `${o.notes ? `${o.notes} | ` : ""}CANCELADA: ${motivo}`,
        } as any)
        .eq("id", orderId);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      toast.success("Venda cancelada e valores estornados");
      qc.invalidateQueries({ queryKey: ["vendas_hoje"] });
      qc.invalidateQueries({ queryKey: ["sales_history"] });
      qc.invalidateQueries({ queryKey: ["conta-botijoes"] });
      qc.invalidateQueries({ queryKey: ["relatorio-vasilhames"] });
      qc.invalidateQueries({ queryKey: ["saldo_portaria"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes_portaria"] });
    },
    onError: (e: Error) => toast.error(`Erro ao cancelar venda: ${e.message}`),
  });
}
