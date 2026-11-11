/**
 * Carga dos entregadores (ações controladas G1: SQL 004/006/007).
 * Leituras e gravações passam pelas funções do banco; nada é calculado ou gravado direto nas tabelas.
 * Com VITE_G1_ACOES=off as consultas ficam desligadas (caminho antigo).
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { G1_ACOES, acao } from "@/lib/g1/acoes";

export const PRODUTOS_CARGA = [
  { value: "P13", label: "Gás P13" },
  { value: "P20", label: "Gás P20" },
  { value: "P45", label: "Gás P45" },
  { value: "agua", label: "Água 20L" },
] as const;
export type ProdutoCarga = (typeof PRODUTOS_CARGA)[number]["value"];
export const rotuloProduto = (p: string) => PRODUTOS_CARGA.find((x) => x.value === p)?.label ?? p;

/** Mesma normalização do banco (_produto_chave): texto livre -> P13/P20/P45/agua. */
export function produtoCarga(texto?: string | null): ProdutoCarga | null {
  const t = (texto ?? "").toUpperCase();
  if (t.includes("P13")) return "P13";
  if (t.includes("P20")) return "P20";
  if (t.includes("P45")) return "P45";
  if (/ÁGUA|AGUA/.test(t)) return "agua";
  return null;
}

export interface CargaResumoLinha {
  carga_id: string;
  entregador_id: string;
  entregador_nome: string;
  aberta_em: string;
  produto: ProdutoCarga;
  cheios: number;
  vazios: number;
  cascos_entregues: number;
}

export interface CargaMovimento {
  id: string;
  carga_id: string;
  entregador_id: string;
  entregador_nome: string;
  tipo: "saida_portaria" | "consumo_entrega" | "consumo_venda_rua" | "devolucao";
  produto: string;
  delta_cheios: number;
  delta_vazios: number;
  order_id: string | null;
  cliente: string | null;
  registrado_por_nome: string;
  criado_em: string;
}

export const ROTULO_MOVIMENTO: Record<CargaMovimento["tipo"], string> = {
  saida_portaria: "Saída da portaria",
  consumo_entrega: "Entrega concluída",
  consumo_venda_rua: "Venda na rua",
  devolucao: "Devolução à portaria",
};

/** Saldo da carga aberta. `entregadorId` vazio: operador vê todos; entregador vê a própria. */
export function useCargaResumo(entregadorId?: string | null) {
  return useQuery({
    queryKey: ["carga-resumo", entregadorId ?? "todos"],
    enabled: G1_ACOES,
    queryFn: () => acao<CargaResumoLinha[]>("carga_resumo", { _entregador_id: entregadorId || null }),
    refetchInterval: 30_000,
  });
}

export function useCargaHistorico(entregadorId?: string | null, dias = 7) {
  return useQuery({
    queryKey: ["carga-historico", entregadorId ?? "todos", dias],
    enabled: G1_ACOES,
    queryFn: () => acao<CargaMovimento[]>("carga_historico", { _entregador_id: entregadorId || null, _dias: dias }),
  });
}

export interface SaldoTransferivel {
  data_operacao: string;
  produto: ProdutoCarga;
  abertura_registrada: boolean;
  cheios: number;
}

/** Cheios que podem sair agora da portaria (mesma regra da transferência). Só operador/admin. */
export function useSaldoTransferivel(produto?: string | null, ativo = true) {
  return useQuery({
    queryKey: ["saldo-transferivel", produto],
    enabled: G1_ACOES && ativo && !!produto,
    queryFn: async () => {
      const r = await acao<SaldoTransferivel[]>("saldo_transferivel_portaria", { _produto: produto });
      return r?.[0] ?? null;
    },
  });
}

/** Cheios de um produto na carga aberta (0 quando não há carga). */
export function cheiosNaCarga(linhas: CargaResumoLinha[] | undefined, entregadorId: string | null | undefined, produto: string | null) {
  if (!linhas || !entregadorId || !produto) return 0;
  return linhas.find((l) => l.entregador_id === entregadorId && l.produto === produto)?.cheios ?? 0;
}

/** Atualiza tudo o que depende da carga e da portaria depois de uma ação confirmada. */
export function useInvalidarCarga() {
  const qc = useQueryClient();
  return () =>
    ["carga-resumo", "carga-historico", "saldo-transferivel", "saldo_portaria", "movimentacoes_portaria", "my-deliveries"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
}
