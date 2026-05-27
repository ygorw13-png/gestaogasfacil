import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PortariaProduto = "P13" | "P20" | "P45" | "agua";

export type MovimentacaoTipo =
  | "abertura"
  | "transferencia_patio_para_portaria"
  | "transferencia_portaria_para_patio"
  | "venda"
  | "venda_comodato"
  | "devolucao_vasilhame"
  | "fechamento"
  | "ajuste";

export interface SaldoPortaria {
  produto: PortariaProduto;
  cheios: number;
  vazios: number;
  emprestados: number;
  devolucoes_dia: number;
  vendas_dia: number;
}

export interface MovimentacaoPortaria {
  id: string;
  tipo: MovimentacaoTipo;
  produto: PortariaProduto;
  delta_cheios: number;
  delta_vazios: number;
  delta_emprestados: number;
  cliente_id: string | null;
  cliente_nome: string | null;
  referencia_id: string | null;
  observacoes: string | null;
  registrado_por: string;
  registrado_por_nome: string | null;
  data_operacao: string;
  criado_em: string;
}

const PRODUTOS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

const today = () => new Date().toISOString().slice(0, 10);

export function useSaldoPortaria() {
  return useQuery({
    queryKey: ["saldo_portaria", today()],
    queryFn: async (): Promise<Record<PortariaProduto, SaldoPortaria>> => {
      const { data, error } = await (supabase as any)
        .from("saldo_portaria_atual")
        .select("*")
        .eq("data_operacao", today());

      if (error) throw error;

      const map: Record<PortariaProduto, SaldoPortaria> = {
        P13: { produto: "P13", cheios: 0, vazios: 0, emprestados: 0, devolucoes_dia: 0, vendas_dia: 0 },
        P20: { produto: "P20", cheios: 0, vazios: 0, emprestados: 0, devolucoes_dia: 0, vendas_dia: 0 },
        P45: { produto: "P45", cheios: 0, vazios: 0, emprestados: 0, devolucoes_dia: 0, vendas_dia: 0 },
        agua: { produto: "agua", cheios: 0, vazios: 0, emprestados: 0, devolucoes_dia: 0, vendas_dia: 0 },
      };

      (data || []).forEach((row: any) => {
        if (PRODUTOS.includes(row.produto)) {
          map[row.produto as PortariaProduto] = {
            produto: row.produto,
            cheios: row.cheios ?? 0,
            vazios: row.vazios ?? 0,
            emprestados: row.emprestados ?? 0,
            devolucoes_dia: row.devolucoes_dia ?? 0,
            vendas_dia: row.vendas_dia ?? 0,
          };
        }
      });

      return map;
    },
    refetchOnWindowFocus: false,
  });
}

export function useMovimentacoesPortaria(dataOperacao?: string) {
  const data = dataOperacao || today();
  return useQuery({
    queryKey: ["movimentacoes_portaria", data],
    queryFn: async (): Promise<MovimentacaoPortaria[]> => {
      const { data: rows, error } = await (supabase as any)
        .from("movimentacoes_portaria")
        .select("*")
        .eq("data_operacao", data)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return (rows || []) as MovimentacaoPortaria[];
    },
  });
}

interface RegistrarParams {
  tipo: MovimentacaoTipo;
  produto: PortariaProduto;
  delta_cheios?: number;
  delta_vazios?: number;
  delta_emprestados?: number;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  referencia_id?: string | null;
  observacoes?: string | null;
}

export function useRegistrarMovimentacao() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: RegistrarParams) => {
      const { data, error } = await (supabase as any).rpc("registrar_movimentacao_portaria", {
        _tipo: params.tipo,
        _produto: params.produto,
        _delta_cheios: params.delta_cheios ?? 0,
        _delta_vazios: params.delta_vazios ?? 0,
        _delta_emprestados: params.delta_emprestados ?? 0,
        _cliente_id: params.cliente_id ?? null,
        _cliente_nome: params.cliente_nome ?? null,
        _referencia_id: params.referencia_id ?? null,
        _observacoes: params.observacoes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saldo_portaria"] });
      qc.invalidateQueries({ queryKey: ["movimentacoes_portaria"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: err?.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });
}

export const produtoLabel = (p: PortariaProduto) =>
  p === "agua" ? "Água 20L" : `GLP ${p}`;

export const tipoLabel = (t: MovimentacaoTipo): string => {
  const map: Record<MovimentacaoTipo, string> = {
    abertura: "Abertura do dia",
    transferencia_patio_para_portaria: "Recebido do pátio",
    transferencia_portaria_para_patio: "Enviado ao pátio",
    venda: "Venda",
    venda_comodato: "Venda com comodato",
    devolucao_vasilhame: "Devolução de vasilhame",
    fechamento: "Fechamento",
    ajuste: "Ajuste manual",
  };
  return map[t];
};
