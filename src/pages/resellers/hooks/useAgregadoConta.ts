import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Retirada de agregado com quantidades (nunca valores). Ação agregado_conta, candidato 017. */
export interface RetiradaAgregado {
  order_id: string;
  criado_em: string;
  produto: string;
  tipo_venda: string;
  quantidade: number;
  acertada: number;
  devolvida: number;
  em_devolucao: boolean;
  pendente: number;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, args: Record<string, unknown>) => (supabase as any).rpc(fn, args);

export async function buscarContaAgregado(resellerId: string): Promise<RetiradaAgregado[]> {
  const { data, error } = await rpc("agregado_conta", { _reseller_id: resellerId });
  if (error) throw error;
  return (data ?? []) as RetiradaAgregado[];
}

export function useAgregadoConta(resellerId?: string) {
  return useQuery({
    queryKey: ["agregado-conta", resellerId],
    enabled: !!resellerId,
    queryFn: () => buscarContaAgregado(resellerId!),
  });
}

export interface ResumoQtd {
  retirada: number;
  devolvida: number;
  acertada: number;
  pendente: number;
  emDevolucao: number;
}

export function resumirConta(l: RetiradaAgregado[]): ResumoQtd {
  return l.reduce(
    (a, r) => ({
      retirada: a.retirada + r.quantidade,
      devolvida: a.devolvida + r.devolvida,
      acertada: a.acertada + r.acertada,
      pendente: a.pendente + r.pendente,
      emDevolucao: a.emDevolucao + (r.em_devolucao && r.devolvida < r.quantidade ? r.quantidade - r.devolvida : 0),
    }),
    { retirada: 0, devolvida: 0, acertada: 0, pendente: 0, emDevolucao: 0 },
  );
}

/** Resumo quantitativo de todos os agregados (aba Conta). */
export function useResumoAgregados(ids: string[]) {
  return useQuery({
    queryKey: ["agregado-conta", "todos", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const listas = await Promise.all(ids.map((id) => buscarContaAgregado(id)));
      return Object.fromEntries(ids.map((id, i) => [id, resumirConta(listas[i])])) as Record<string, ResumoQtd>;
    },
  });
}

export interface AcertoFin {
  id: string;
  data: string;
  criado_em: string;
  valor: number;
  ajustes: number;
  credito_usado: number;
  recebido: number;
  sobra_credito: number;
  saldo: number;
  observacoes: string | null;
  criado_por: string | null;
  itens: { order_id: string; quantidade: number; produto: string }[] | null;
}
export interface CreditoFin {
  id: string;
  tipo: "por_conta" | "credito_ajuste";
  data: string;
  recebido_em: string;
  valor: number;
  forma: string | null;
  saldo: number;
  anulado: boolean;
  observacoes: string | null;
}
export interface LancamentoFin {
  id: string;
  tipo: string;
  valor: number;
  forma: string | null;
  destino: string | null;
  acerto_id: string | null;
  credito_id: string | null;
  order_id: string | null;
  data: string;
  recebido_em: string;
  observacoes: string | null;
  anulado_em: string | null;
  anulado_motivo: string | null;
  registrado_por: string | null;
}
export interface FinanceiroAgregado {
  precos: Record<string, number>;
  acertos: AcertoFin[];
  creditos: CreditoFin[];
  lancamentos: LancamentoFin[];
}

/** Só administrador (o banco recusa os demais). */
export function useAgregadoFinanceiro(resellerId: string | undefined, ehAdmin: boolean) {
  return useQuery({
    queryKey: ["agregado-financeiro", resellerId],
    enabled: !!resellerId && ehAdmin,
    queryFn: async (): Promise<FinanceiroAgregado> => {
      const { data, error } = await rpc("agregado_financeiro", { _reseller_id: resellerId });
      if (error) throw error;
      const d = data as FinanceiroAgregado;
      const n = (v: unknown) => Number(v ?? 0);
      return {
        precos: Object.fromEntries(Object.entries(d.precos ?? {}).map(([k, v]) => [k, n(v)])),
        acertos: (d.acertos ?? []).map((a) => ({ ...a, valor: n(a.valor), ajustes: n(a.ajustes), credito_usado: n(a.credito_usado),
          recebido: n(a.recebido), sobra_credito: n(a.sobra_credito), saldo: n(a.saldo) })),
        creditos: (d.creditos ?? []).map((c) => ({ ...c, valor: n(c.valor), saldo: n(c.saldo) })),
        lancamentos: (d.lancamentos ?? []).map((l) => ({ ...l, valor: n(l.valor) })),
      };
    },
  });
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const NOME_TIPO: Record<string, string> = {
  por_conta: "Por conta recebido",
  pagamento: "Dinheiro recebido no acerto",
  uso_credito: "Crédito utilizado",
  ajuste: "Ajuste administrativo",
  credito_ajuste: "Sobra do acerto (crédito)",
  devolucao_credito: "Crédito devolvido",
};
export const NOME_FORMA: Record<string, string> = { dinheiro: "Dinheiro", pix: "PIX", cartao: "Cartão" };
