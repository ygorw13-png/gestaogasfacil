import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CashierData } from "../types/cashierTypes";

export interface EstoqueFinalItem {
  produto: string;
  vendas: number;
  sistemaCheios: number;
  contadoCheios: number;
  sistemaVazios: number;
  contadoVazios: number;
}

export interface FechamentoCaixa {
  id: string;
  data_fechamento: string;
  tipo: "partial" | "total";
  total_vendas: number;
  total_dinheiro: number;
  total_pix: number;
  total_cartao: number;
  total_outros: number;
  quantidades: CashierData | null;
  estoque_final: EstoqueFinalItem[];
  divergencias: { produto: string; cheios: number; vazios: number }[];
  tem_divergencia: boolean;
  observacoes: string | null;
  retroativo: boolean;
  fechado_por_nome: string | null;
  created_at: string;
}

export interface FechamentoFilters {
  search?: string;
  tipo?: "all" | "partial" | "total";
  somenteDivergencia?: boolean;
}

export function useFechamentosCaixa(filters: FechamentoFilters = {}) {
  const { search = "", tipo = "all", somenteDivergencia = false } = filters;

  return useQuery({
    queryKey: ["fechamentos_caixa", search, tipo, somenteDivergencia],
    queryFn: async (): Promise<FechamentoCaixa[]> => {
      let query = (supabase as any)
        .from("fechamentos_caixa")
        .select("*")
        .order("data_fechamento", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (tipo !== "all") query = query.eq("tipo", tipo);
      if (somenteDivergencia) query = query.eq("tem_divergencia", true);
      if (search) query = query.eq("data_fechamento", search);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FechamentoCaixa[];
    },
  });
}

/** Retorna o fechamento total do dia atual (se já existir). */
export function useFechamentoDeHoje() {
  const hoje = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["fechamento_hoje", hoje],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("fechamentos_caixa")
        .select("id, tipo, data_fechamento")
        .eq("data_fechamento", hoje)
        .eq("tipo", "total")
        .maybeSingle();
      if (error) throw error;
      return data as { id: string } | null;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Verifica se já existe fechamento salvo para uma data (para exigir motivo em alterações). */
export function useFechamentoPorData(dateStr: string | null) {
  return useQuery({
    queryKey: ["fechamento_por_data", dateStr],
    enabled: !!dateStr,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("fechamentos_caixa")
        .select("id, tipo, created_at, observacoes")
        .eq("data_fechamento", dateStr)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as { id: string; tipo: string; created_at: string } | null;
    },
  });
}

export interface SalvarFechamentoParams {
  data_fechamento: string;
  tipo: "partial" | "total";
  cashierData: CashierData;
  estoque: EstoqueFinalItem[];
  divergencias: { produto: string; cheios: number; vazios: number }[];
  observacoes?: string;
  retroativo: boolean;
}

export function useSalvarFechamento() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (p: SalvarFechamentoParams) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      let nome: string | null = null;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", uid)
          .maybeSingle();
        nome = prof?.name ?? null;
      }

      const c = p.cashierData;
      const payload = {
        data_fechamento: p.data_fechamento,
        tipo: p.tipo,
        total_vendas: c.totalSales,
        total_dinheiro: c.cash,
        total_pix: c.pix,
        total_cartao: c.credit + c.debit,
        total_outros: c.promissory + c.gasVoucher,
        quantidades: c as any,
        estoque_final: p.estoque as any,
        divergencias: p.divergencias as any,
        tem_divergencia: p.divergencias.length > 0,
        observacoes: p.observacoes || null,
        retroativo: p.retroativo,
        fechado_por_nome: nome,
      };

      const { data, error } = await (supabase as any)
        .from("fechamentos_caixa")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as FechamentoCaixa;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos_caixa"] });
      qc.invalidateQueries({ queryKey: ["fechamento_hoje"] });
      qc.invalidateQueries({ queryKey: ["fechamento_por_data"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao salvar fechamento",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
}
