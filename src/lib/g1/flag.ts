/**
 * Chave das ações controladas do G1 e regra da fila offline.
 * Fica num arquivo próprio para a fila offline poder usar sem depender de `acoes.ts`.
 */
export const G1_ACOES = import.meta.env.VITE_G1_ACOES === "on";

/** Registros que só mudam pelas ações controladas (vendas, estoque, carga, dívidas, recebimentos). */
export const TABELAS_CONTROLADAS = [
  "orders",
  "promissory_notes",
  "recebimentos",
  "cargas",
  "carga_movimentos",
  "movimentacoes_portaria",
  "divergencias",
  "auditoria_correcoes",
  "acoes_idempotentes",
] as const;

export const MENSAGEM_BLOQUEIO_FILA =
  "Lançamento antigo, guardado no aparelho como gravação direta em vendas, estoque ou dívidas. " +
  "Não foi enviado para não contornar as regras de carga e recebimento. Confira e lance de novo pela tela.";

/**
 * Com as ações controladas ligadas, a fila offline nunca envia gravação direta
 * nesses registros (nem com "enviar mesmo assim"). Devolve o motivo ou null.
 */
export function motivoBloqueioFila(
  op: { action: string; target: string },
  ligado: boolean = G1_ACOES,
): string | null {
  if (!ligado || op.action === "rpc") return null;
  return (TABELAS_CONTROLADAS as readonly string[]).includes(op.target) ? MENSAGEM_BLOQUEIO_FILA : null;
}

/** Ação controlada com chave de reenvio: nunca é descartada sozinha (é uma venda ou recebimento real). */
export function acaoComChave(op: { action: string; payload?: Record<string, unknown> }) {
  return op.action === "rpc" && typeof op.payload?._chave === "string" && op.payload._chave.length > 0;
}
