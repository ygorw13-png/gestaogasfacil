import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openWhatsApp } from "@/utils/whatsappLinks";

export interface EnvioWhatsApp {
  telefone?: string | null;
  mensagem: string;
  nome?: string | null;
  tipo?: string;
  referencia_id?: string | null;
}

interface EnvioResultado {
  provider: string | null;
  enviados: number;
  total: number;
  results: Array<{ ok: boolean; telefone: string | null; erro?: string | null }>;
}

/**
 * Envia mensagens de WhatsApp pelo backend (Evolution API ou Twilio).
 * Se nenhum provedor estiver configurado, cai automaticamente no link wa.me.
 */
export function useEnviarWhatsApp() {
  const mutation = useMutation({
    mutationFn: async (mensagens: EnvioWhatsApp | EnvioWhatsApp[]) => {
      const lista = Array.isArray(mensagens) ? mensagens : [mensagens];
      const { data, error } = await supabase.functions.invoke("enviar-whatsapp", {
        body: { mensagens: lista },
      });
      if (error) throw error;
      return data as EnvioResultado;
    },
  });

  /**
   * Envia uma mensagem. Retorna true se o backend enviou;
   * false se precisou abrir o WhatsApp manualmente.
   */
  const enviar = async (msg: EnvioWhatsApp, opts?: { silencioso?: boolean }): Promise<boolean> => {
    try {
      const res = await mutation.mutateAsync(msg);
      if (res?.enviados > 0) {
        if (!opts?.silencioso) toast.success("Mensagem enviada no WhatsApp");
        return true;
      }
      const erro = res?.results?.[0]?.erro;
      if (erro && erro !== "provider_nao_configurado") {
        toast.error("Falha no envio automático — abrindo o WhatsApp");
      }
    } catch {
      // backend indisponível — segue para o fallback
    }

    const aberto = openWhatsApp(msg.telefone, msg.mensagem);
    if (!aberto) {
      navigator.clipboard?.writeText(msg.mensagem).catch(() => {});
      toast.error("Telefone inválido. Mensagem copiada para a área de transferência.");
    }
    return false;
  };

  /** Envia várias mensagens de uma vez (ex.: campanha de recompra/cobrança). */
  const enviarLote = async (mensagens: EnvioWhatsApp[]) => {
    const res = await mutation.mutateAsync(mensagens);
    if (res?.enviados > 0) {
      toast.success(`${res.enviados} de ${res.total} mensagens enviadas`);
    } else {
      toast.error("Nenhuma mensagem enviada. Configure o WhatsApp ou envie pelos links.");
    }
    return res;
  };

  return { enviar, enviarLote, enviando: mutation.isPending };
}
