/**
 * Camada única para as ações controladas do G1 (funções do banco que validam
 * papel, empresa, conta ativa e transição, travam o registro e aceitam chave
 * contra reenvio).
 *
 * Fica DESLIGADA por padrão (`VITE_G1_ACOES` diferente de "on"): o banco
 * publicado ainda não tem essas funções, então as telas continuam no caminho
 * atual. Ligada só no ambiente isolado de teste até a aprovação de produção.
 */
import { supabase } from "@/integrations/supabase/client";
import { runOrQueue } from "@/lib/offline/queue";
import { ehIncerta } from "@/lib/g1/operacao";

import { G1_ACOES } from "@/lib/g1/flag";
export { G1_ACOES };

/** Chave de reenvio: a mesma chave em cada tentativa = um resultado só. */
export const novaChave = (prefixo: string) => `${prefixo}:${crypto.randomUUID()}`;

/** Converte a forma de pagamento das telas para a do recebimento. null = sem regra decidida. */
export function formaRecebimento(f?: string | null): "dinheiro" | "pix" | "cartao" | "promissoria" | null {
  // sem acento e minúsculo: "Cartão de Crédito" -> "cartao de credito"
  const t = (f || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  switch (t) {
    case "money": case "dinheiro": case "cash": return "dinheiro";
    case "pix": return "pix";
    case "credit": case "debit": case "card": case "cartao": case "credito": case "debito":
    case "cartao de credito": case "cartao de debito": return "cartao";
    case "promissoria": case "convenio": return "promissoria";
    // Transferência bancária, vale-gás etc.: sem regra de recebimento decidida (decisão 7).
    default: return null;
  }
}

/** Mensagem do banco, sem detalhes técnicos. */
export function mensagemAcao(e: unknown): string {
  const m = (e as { message?: string })?.message || String(e || "");
  if (/permission denied|42501|Sem permissão/i.test(m) && !/decisão B|ação autorizada/i.test(m))
    return m.includes("Sem permissão") ? "Sem permissão para esta ação." : "Ação não permitida para sua conta.";
  return m.replace(/^ERROR:\s*/, "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, args?: Record<string, unknown>) => (supabase as any).rpc(fn, args);

/**
 * Falha de uma ação. `incerta` = sem resposta do servidor (rede, tempo esgotado):
 * a gravação pode ter acontecido, então a tela deve conservar a chave de reenvio.
 */
export class AcaoError extends Error {
  constructor(message: string, public readonly incerta: boolean) {
    super(message);
    this.name = "AcaoError";
  }
}

/** Chama a ação e devolve o resultado ou lança AcaoError com mensagem legível. */
export async function acao<T = unknown>(nome: string, args: Record<string, unknown>): Promise<T> {
  let res: { data: unknown; error: { code?: string; status?: number; message?: string } | null };
  try {
    res = await rpc(nome, args);
  } catch (e) {
    // fetch rejeitado (sem rede, corte no meio): resposta desconhecida
    throw new AcaoError("Sem resposta do servidor. Não sabemos se foi gravado.", true);
  }
  if (res.error) {
    const incerta = ehIncerta(res.error);
    throw new AcaoError(incerta ? "Sem resposta confiável do servidor. A operação pode ter sido gravada." : mensagemAcao(res.error), incerta);
  }
  return res.data as T;
}

/**
 * Ação que pode ficar na fila offline. A chave vai DENTRO dos argumentos,
 * então cada reenvio automático usa a mesma chave e o banco devolve o mesmo
 * resultado em vez de gravar de novo.
 */
export async function acaoOuFila(nome: string, args: Record<string, unknown>, descricao: string) {
  if (!args._chave) throw new Error("Ação offline exige chave de reenvio");
  return runOrQueue({ target: nome, action: "rpc", payload: args, description: descricao });
}
