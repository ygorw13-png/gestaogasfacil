import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function chamar(acao: "estado" | "conectar"): Promise<Json> {
  const { data, error } = await supabase.functions.invoke("whatsapp-qr", { body: { acao } });
  if (error) {
    const det = error instanceof FunctionsHttpError ? await error.context.text().catch(() => "") : error.message;
    let corpo: Json = null; try { corpo = JSON.parse(det); } catch { /* texto */ }
    if (corpo?.servidor_configurado === false) return corpo;
    throw new Error(corpo?.error ?? det ?? "Falha ao consultar o servidor de QR.");
  }
  return data;
}

const ESTADO: Record<string, string> = { inexistente: "Nenhuma sessão criada", close: "Desconectado", connecting: "Aguardando leitura do QR", desconhecido: "Situação não informada pelo servidor" };

/** Conexão opcional por QR code (sem Facebook). Só mostra o que o servidor Evolution confirma; QR fica só na memória da tela. */
export function WhatsAppQrSettings() {
  const qc = useQueryClient();
  const [qr, setQr] = useState<{ img: string; expira: number } | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const st = useQuery({ queryKey: ["whatsapp-qr-estado"], queryFn: () => chamar("estado"), retry: false, refetchInterval: qr ? 4000 : false });
  const d = st.data;
  const expirado = !!qr && agora >= qr.expira;

  useEffect(() => {
    if (!qr) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [qr]);
  useEffect(() => { if (d?.conectado) setQr(null); }, [d?.conectado]);
  useEffect(() => { if (expirado) setQr(null); }, [expirado]);

  const conectar = async () => {
    setOcupado(true); setMsg(null);
    try {
      const r = await chamar("conectar");
      if (r?.servidor_configurado === false) setMsg(r.motivo);
      else if (r?.qr && r?.expira_em) { setQr({ img: r.qr, expira: Date.parse(r.expira_em) }); setAgora(Date.now()); }
      else if (!r?.conectado) setMsg("O servidor não devolveu QR code.");
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { setOcupado(false); qc.invalidateQueries({ queryKey: ["whatsapp-qr-estado"] }); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conectar por QR (opcional, sem Facebook)</CardTitle>
        <CardDescription>
          Usa um servidor Evolution API próprio da empresa, ligado o tempo todo, que mantém a sessão do WhatsApp Web. Não é a API oficial da Meta e o WhatsApp pode restringir números conectados assim. Nesta versão serve só para conectar e conferir o número: os avisos de entrega continuam pelo WhatsApp oficial e o envio automático não muda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {st.isLoading && <p className="text-muted-foreground">Consultando o servidor…</p>}
        {st.isError && <p className="text-destructive">{(st.error as Error).message}</p>}
        {d?.servidor_configurado === false && (
          <div className="space-y-1">
            <p><Badge variant="outline">Servidor não configurado</Badge></p>
            <p className="text-xs text-muted-foreground">Falta um servidor Evolution API (v2) em funcionamento e seus dados guardados no servidor do GásFácil. Nenhum QR é gerado até lá.</p>
          </div>
        )}
        {d?.servidor_configurado && (
          <p>
            {d.conectado ? <Badge>Conectado (confirmado pelo servidor)</Badge> : <Badge variant="outline">{ESTADO[d.estado] ?? d.estado}</Badge>}{" "}
            {d.conectado && <>Número: <strong>{d.numero ? `+${d.numero}` : "não informado"}</strong>{d.perfil ? ` (${d.perfil})` : ""}</>}
          </p>
        )}
        {d?.servidor_configurado && !d.conectado && !qr && (
          <Button size="sm" disabled={ocupado} onClick={conectar}>{ocupado ? "Gerando QR…" : "Conectar por QR"}</Button>
        )}
        {qr && (
          <div className="space-y-2">
            <img src={qr.img} alt="QR code para conectar o WhatsApp" className="h-56 w-56 rounded-md border bg-card p-2" />
            <p className="text-xs text-muted-foreground">No celular: WhatsApp → Aparelhos conectados → Conectar aparelho. Válido por mais {Math.max(0, Math.ceil((qr.expira - agora) / 1000))} s.</p>
          </div>
        )}
        {msg && <p>{msg}</p>}
        {!qr && !d?.conectado && d?.servidor_configurado && <p className="text-xs text-muted-foreground">Se o QR expirar, gere outro.</p>}
      </CardContent>
    </Card>
  );
}
