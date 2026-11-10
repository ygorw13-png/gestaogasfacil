import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { G1_ACOES, acao } from "@/lib/g1/acoes";
import { useRegistrarMovimentacao, type PortariaProduto } from "./usePortariaStock";
import { vasilhameDeltas, type TipoVenda } from "@/lib/saleTypes";

export const produtoFrom = (product?: string | null): PortariaProduto | null => {
  const p = (product || "").toUpperCase();
  if (p.includes("P13")) return "P13";
  if (p.includes("P20")) return "P20";
  if (p.includes("P45")) return "P45";
  if (p.includes("ÁGUA") || p.includes("AGUA")) return "agua";
  return null;
};

export interface EditarVendaInput {
  orderId: string;
  product: string;
  quantity: number;
  price: number;
  payment_method: string;
  motivo: string;
}

/** Edita uma venda já lançada, ajustando o estoque da portaria pela diferença. */
export function useEditarVenda() {
  const qc = useQueryClient();
  const registrarMov = useRegistrarMovimentacao();

  return useMutation({
    mutationFn: async (input: EditarVendaInput) => {
      if (G1_ACOES) {
        // Decisão A: só administrador muda preço, com motivo e auditoria.
        // Produto, quantidade e forma mexem em estoque/recebimento: bloqueados até a decisão B.
        const { data: atual, error: e0 } = await supabase.from("orders").select("product, quantity, payment_method, price").eq("id", input.orderId).maybeSingle();
        if (e0) throw e0;
        if (!atual) throw new Error("Venda não encontrada");
        const a = atual as any;
        if (a.product !== input.product || Number(a.quantity) !== input.quantity || (a.payment_method || "") !== (input.payment_method || ""))
          throw new Error("Trocar produto, quantidade ou forma de pagamento de venda lançada ainda não tem regra aprovada (decisão B). Só o valor pode ser corrigido pelo administrador.");
        if (Number(a.price) === input.price) throw new Error("Nada a corrigir.");
        await acao("admin_corrigir_pedido", { _order_id: input.orderId, _novo_preco: input.price, _novo_status: null, _motivo: input.motivo });
        return;
      }
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", input.orderId)
        .maybeSingle();
      if (error) throw error;
      if (!order) throw new Error("Venda não encontrada");

      const o = order as any;
      const oldQty = Number(o.quantity) || 0;
      const newQty = Number(input.quantity) || 0;
      const oldProduto = produtoFrom(o.product);
      const newProduto = produtoFrom(input.product);
      const isVasilhame = o.tipo_venda === "vasilhame";
      const isComodato = o.has_empty_cylinder === false;
      const obs = `Edição de venda - ${input.motivo}`;

      const aplicar = async (produto: PortariaProduto, qty: number, sinal: 1 | -1) => {
        if (!qty) return;
        if (isVasilhame) {
          await registrarMov.mutateAsync({
            tipo: "ajuste",
            produto: "P13",
            delta_cheios: 0,
            delta_vazios: sinal * qty,
            delta_emprestados: 0,
            cliente_id: o.client_id || null,
            cliente_nome: o.client_name || null,
            referencia_id: input.orderId,
            observacoes: obs,
          });
          return;
        }
        await registrarMov.mutateAsync({
          tipo: "ajuste",
          produto,
          delta_cheios: sinal * qty,
          delta_vazios: isComodato ? 0 : -sinal * qty,
          delta_emprestados: isComodato ? -sinal * qty : 0,
          cliente_id: o.client_id || null,
          cliente_nome: o.client_name || null,
          referencia_id: input.orderId,
          observacoes: obs,
        });
      };

      // Ajuste de estoque: estorna o antigo e aplica o novo (sinal +1 devolve ao estoque)
      if (oldProduto && newProduto && oldProduto === newProduto) {
        const diff = newQty - oldQty;
        if (diff !== 0) await aplicar(newProduto, Math.abs(diff), diff > 0 ? -1 : 1);
      } else {
        if (oldProduto) await aplicar(oldProduto, oldQty, 1);
        if (newProduto) await aplicar(newProduto, newQty, -1);
      }

      // Ajuste na ficha do parceiro (agregado / ponto de revenda)
      if (!isVasilhame && newQty !== oldQty) {
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

        if (parceiro) {
          await supabase.from("conta_botijoes" as any).insert({
            parceiro_tipo: parceiro.tipo,
            parceiro_id: parceiro.id,
            parceiro_nome: parceiro.nome,
            tipo: "ajuste",
            produto: newProduto ?? "P13",
            quantidade: newQty - oldQty,
            vasilhames_recebidos: 0,
            data: new Date().toISOString().slice(0, 10),
            order_id: input.orderId,
            observacoes: obs,
          } as any);
        }
      }

      const tipo = (o.tipo_venda || "recarga") as TipoVenda;
      const deltas = vasilhameDeltas(tipo, newQty);

      const { error: upErr } = await supabase
        .from("orders")
        .update({
          product: input.product,
          quantity: newQty,
          price: input.price,
          payment_method: input.payment_method,
          vasilhames_entregues: deltas.entregues,
          vasilhames_recebidos: deltas.recebidos,
          notes: `${o.notes ? `${o.notes} | ` : ""}EDITADA: ${input.motivo}`,
        } as any)
        .eq("id", input.orderId);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      toast.success("Venda atualizada");
      qc.invalidateQueries({ queryKey: ["vendas_hoje"] });
      qc.invalidateQueries({ queryKey: ["sales_history"] });
      qc.invalidateQueries({ queryKey: ["conta-botijoes"] });
      qc.invalidateQueries({ queryKey: ["relatorio-vasilhames"] });
      qc.invalidateQueries({ queryKey: ["saldo_portaria"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes_portaria"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["estoque_retirado"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes_portaria_periodo"] });
      qc.invalidateQueries({ queryKey: ["promissory_notes"] });

    },
    onError: (e: Error) => toast.error(`Erro ao editar venda: ${e.message}`),
  });
}
