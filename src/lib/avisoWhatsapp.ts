import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

/** Canais do aviso ao atribuir uma entrega. Não existe "só app" nem "sem WhatsApp". */
export type CanalAviso = "app_whatsapp" | "whatsapp";
export const CANAIS_AVISO: { valor: CanalAviso; rotulo: string; disponivel: boolean; nota: string }[] = [
  { valor: "app_whatsapp", rotulo: "App + WhatsApp", disponivel: true, nota: "A entrega aparece no app e o WhatsApp é enviado pelo sistema." },
  { valor: "whatsapp", rotulo: "Só WhatsApp", disponivel: false, nota: "Indisponível por enquanto: depende de o sistema receber o aceite/recusa pelo WhatsApp." },
];

export const ESTADO_ENVIO: Record<string, string> = {
  aguardando: "Aguardando envio", enviando: "Enviando…", enviado: "Enviado à plataforma", entregue: "Entregue",
  lido: "Lido", falha: "Falha", incerto: "Resultado incerto", cancelado: "Cancelado",
};

export interface ResultadoEnvio { envio_id: string; status: string; erro?: string | null; motivo?: string }

/** Pede ao servidor o envio dos avisos já gravados (do pedido, ou um envio para nova tentativa). */
export async function processarAviso(p: { order_id?: string; envio_id?: string; confirmar_incerto?: boolean }): Promise<ResultadoEnvio[]> {
  const { data, error } = await supabase.functions.invoke("whatsapp-envio", { body: p });
  if (error) {
    const det = error instanceof FunctionsHttpError ? await error.context.text().catch(() => "") : error.message;
    let msg = det;
    try { msg = JSON.parse(det)?.error ?? det; } catch { /* texto */ }
    throw new Error(msg || "Não foi possível falar com o servidor de envio.");
  }
  return (data?.resultados ?? []) as ResultadoEnvio[];
}

/** Resumo para aviso na tela depois de atribuir. */
export function resumoEnvio(r: ResultadoEnvio[]): { ok: boolean; texto: string } {
  if (!r.length) return { ok: true, texto: "Nenhum aviso pendente para enviar." };
  const x = r[r.length - 1];
  if (x.status === "enviado") return { ok: true, texto: "WhatsApp enviado à plataforma (ainda não é o aceite do entregador)." };
  if (x.status === "incerto") return { ok: false, texto: `Resultado incerto: ${x.erro ?? ""} Confira no celular do entregador antes de reenviar.` };
  return { ok: false, texto: x.erro ?? x.motivo ?? "WhatsApp não enviado." };
}
