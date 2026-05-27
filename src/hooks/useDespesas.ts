import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type OrigemDinheiro = "caixa_portaria" | "cofre" | "banco" | "pessoal";
export type TipoDespesa = "combustivel" | "manutencao" | "diversa" | "fixa";

export const ORIGEM_DINHEIRO_LABELS: Record<OrigemDinheiro, string> = {
  caixa_portaria: "Caixa da Portaria (gera sangria)",
  cofre: "Cofre / Caixa da Empresa",
  banco: "Conta Bancária / PIX da Empresa",
  pessoal: "Pessoal (a reembolsar)",
};

export interface DespesaInput {
  tipo: TipoDespesa;
  descricao: string;
  valor: number;
  data: string; // ISO date
  origem_dinheiro: OrigemDinheiro;
  veiculo_id?: string | null;
  veiculo_placa?: string | null;
  categoria?: string | null;
  observacoes?: string | null;
}

export function useDespesas(tipo?: TipoDespesa) {
  return useQuery({
    queryKey: ["despesas", tipo ?? "all"],
    queryFn: async () => {
      let q = supabase.from("despesas" as any).select("*").order("data", { ascending: false });
      if (tipo) q = q.eq("tipo", tipo);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useRegistrarDespesa() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: DespesaInput) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .maybeSingle();

      let caixaMovId: string | null = null;

      // Se origem é caixa da portaria, registra sangria
      if (input.origem_dinheiro === "caixa_portaria") {
        const { data: movId, error: movErr } = await supabase.rpc(
          "registrar_movimentacao_portaria",
          {
            _tipo: "sangria_despesa",
            _produto: "dinheiro",
            _delta_cheios: 0,
            _delta_vazios: 0,
            _delta_emprestados: 0,
            _observacoes: `Despesa: ${input.descricao} - R$ ${input.valor.toFixed(2)}`,
          } as any
        );
        if (movErr) throw movErr;
        caixaMovId = movId as string;

        // Atualiza valor_dinheiro na movimentação (negativo = saída)
        await supabase
          .from("movimentacoes_portaria" as any)
          .update({ valor_dinheiro: -Math.abs(input.valor) })
          .eq("id", caixaMovId);
      }

      const { data, error } = await supabase
        .from("despesas" as any)
        .insert({
          tipo: input.tipo,
          descricao: input.descricao,
          valor: input.valor,
          data: input.data,
          origem_dinheiro: input.origem_dinheiro,
          veiculo_id: input.veiculo_id ?? null,
          veiculo_placa: input.veiculo_placa ?? null,
          categoria: input.categoria ?? null,
          observacoes: input.observacoes ?? null,
          caixa_movimentacao_id: caixaMovId,
          registrado_por_nome: profile?.name ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["despesas"] });
      qc.invalidateQueries({ queryKey: ["saldo-portaria"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes-portaria"] });
      toast({
        title: "Despesa registrada",
        description:
          vars.origem_dinheiro === "caixa_portaria"
            ? "Sangria automática lançada no caixa da portaria."
            : "Lançamento financeiro salvo.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao salvar despesa",
        description: err.message ?? "Tente novamente",
        variant: "destructive",
      });
    },
  });
}
