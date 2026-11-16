import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ESTADO_ENVIO, processarAviso, resumoEnvio } from "@/lib/avisoWhatsapp";

const quando = (t?: string | null) => (t ? new Date(t).toLocaleString("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" }) : "");

/** Avisos de WhatsApp de um pedido: estado de cada envio e nova tentativa sem duplicar. */
export function AvisosWhatsApp({ orderId, nome }: { orderId: string; nome: (id?: string | null) => string }) {
  const qc = useQueryClient();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const envios = useQuery({
    queryKey: ["whatsapp-envios", orderId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("whatsapp_envios")
        .select("id, entregador_id, telefone, canal, status, erro, tentativas, criado_em, enviado_em").eq("order_id", orderId).order("criado_em");
      if (error) throw error;
      return (data ?? []) as Record<string, string | number | null>[];
    },
  });
  const tentar = async (id: string, confirmar = false) => {
    if (confirmar && !window.confirm("O resultado anterior ficou incerto. Confirme que conferiu no celular do entregador e a mensagem NÃO chegou. Reenviar?")) return;
    setOcupado(id); setMsg(null);
    try {
      setMsg(resumoEnvio(await processarAviso({ envio_id: id, confirmar_incerto: confirmar })).texto);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao pedir o envio.");
    } finally {
      setOcupado(null);
      qc.invalidateQueries({ queryKey: ["whatsapp-envios", orderId] });
    }
  };
  if (!envios.data?.length) return null;
  return (
    <div>
      <h3 className="mb-1 font-medium">Avisos pelo WhatsApp</h3>
      <ul className="space-y-2">
        {envios.data.map((e) => {
          const id = String(e.id);
          const st = String(e.status);
          return (
            <li key={id} className="rounded-md border p-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={st === "falha" || st === "incerto" ? "destructive" : st === "enviado" ? "default" : "outline"}>{ESTADO_ENVIO[st] ?? st}</Badge>
                <span>{nome(String(e.entregador_id))} · final {String(e.telefone).slice(-4)}</span>
                <span className="text-xs text-muted-foreground">{quando(String(e.enviado_em ?? e.criado_em))}{Number(e.tentativas) > 1 ? ` · ${e.tentativas} tentativas` : ""}</span>
              </div>
              {e.erro && <p className="mt-1 text-xs text-muted-foreground">{String(e.erro)}</p>}
              {st === "falha" && <Button size="sm" variant="outline" className="mt-2" disabled={ocupado === id} onClick={() => tentar(id)}>{ocupado === id ? "Enviando…" : "Tentar de novo"}</Button>}
              {st === "incerto" && <Button size="sm" variant="outline" className="mt-2" disabled={ocupado === id} onClick={() => tentar(id, true)}>Conferi e não chegou: reenviar</Button>}
            </li>
          );
        })}
      </ul>
      {msg && <p className="mt-2 text-xs">{msg}</p>}
      <p className="mt-1 text-xs text-muted-foreground">"Enviado à plataforma" não significa que o entregador aceitou a entrega. Entregue/Lido ainda não são informados pelo WhatsApp.</p>
    </div>
  );
}
