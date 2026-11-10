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
import { G1_ACOES } from "@/lib/g1/flag";

export { G1_ACOES };

/** Chave de reenvio: a mesma chave em cada tentativa = um resultado só. */
export const novaChave = (prefixo: string) => `${prefixo}:${crypto.randomUUID()}`;

/** Converte a forma de pagamento das telas para a do recebimento. null = sem regra decidida. */
export function formaRecebimento(f?: string | null): "dinheiro" | "pix" | "cartao" | "promissoria" | null {
  switch ((f || "").toLowerCase()) {
    case "money": case "dinheiro": case "cash": return "dinheiro";
    case "pix": return "pix";
    case "credit": case "debit": case "card": case "cartao": return "cartao";
    case "promissoria": case "convenio": return "promissoria";
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

/** Chama a ação e devolve o resultado ou lança com mensagem legível. */
export async function acao<T = unknown>(nome: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(nome, args);
  if (error) throw new Error(mensagemAcao(error));
  return data as T;
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
