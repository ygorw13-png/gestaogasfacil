import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function chamar(body: Record<string, unknown>): Promise<Json> {
  const { data, error } = await supabase.functions.invoke("whatsapp-admin", { body });
  if (error) {
    const det = error instanceof FunctionsHttpError ? await error.context.text().catch(() => "") : error.message;
    let m = det; try { m = JSON.parse(det)?.error ?? det; } catch { /* texto */ }
    throw new Error(m || "Falha ao consultar o WhatsApp.");
  }
  return data;
}

const MODELO_STATUS: Record<string, string> = { APPROVED: "Aprovado", PENDING: "Em análise pela Meta", REJECTED: "Recusado", PAUSED: "Pausado", DISABLED: "Desativado" };

/** Configurações > WhatsApp (só administrador). Mostra só o que a plataforma responde; nada é simulado. */
export function WhatsAppSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tel, setTel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const st = useQuery({ queryKey: ["whatsapp-admin-status"], queryFn: () => chamar({ acao: "status" }), retry: false });
  const d = st.data;
  const numero = d?.numero?.dados;
  const modelo = d?.modelo?.dados?.data?.[0];
  const cfg = d?.config;

  const executar = async (fn: () => Promise<string>) => {
    setOcupado(true); setMsg(null);
    try { setMsg(await fn()); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { setOcupado(false); qc.invalidateQueries({ queryKey: ["whatsapp-admin-status"] }); }
  };
  const ativar = (v: boolean) => executar(async () => {
    if (v && !window.confirm("Cada aviso iniciado pela empresa usa um modelo aprovado e a Meta cobra por mensagem (veja a tabela de preços da Meta para o Brasil). Ativar o envio automático?")) return "Envio não ativado.";
    const { data: org } = await supabase.rpc("get_my_org");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("whatsapp_config").upsert({ organization_id: org, envio_ativo: v, atualizado_por: user?.id, atualizado_em: new Date().toISOString() });
    if (error) throw error;
    return v ? "Envio automático ativado." : "Envio automático desativado.";
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp da empresa</CardTitle>
        <CardDescription>API oficial do WhatsApp Business. Credenciais ficam só no servidor. Somente o administrador vê esta área.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {st.isLoading && <p className="text-muted-foreground">Consultando a conexão…</p>}
        {st.isError && <p className="text-destructive">{(st.error as Error).message}</p>}
        {d && !d.conectado && (
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <p><Badge variant="destructive">Não conectado</Badge> {d.motivo}</p>
            <p className="font-medium">Para conectar, o administrador precisa:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Conectar o número da empresa pelo WhatsApp Business oficial (cartão de conexão no GásFácil/Lovable), com acesso à conta Meta Business da empresa.</li>
              <li>Ter o e-mail e o telefone verificados na Meta e concluir a aprovação da Meta.</li>
              <li>Se o número já está no app WhatsApp Business do celular, ele pode continuar lá (o celular segue funcionando).</li>
              <li>Depois, criar aqui o modelo de mensagem e aguardar a aprovação da Meta (pode levar até 48 h).</li>
            </ul>
          </div>
        )}
        {d?.conectado && (
          <div className="space-y-1">
            <p><Badge>Conectado</Badge> {d.numero?.ok ? "" : `Consulta do número falhou [${d.numero?.http ?? "sem resposta"}]`}</p>
            {numero && typeof numero === "object" && (
              <>
                <p>Número remetente: <strong>{numero.display_phone_number ?? "—"}</strong> {numero.verified_name ? `(${numero.verified_name})` : ""}</p>
                <p>Continua no app WhatsApp Business do celular: {numero.is_on_biz_app === true ? "Sim" : numero.is_on_biz_app === false ? "Não" : "não informado"}</p>
                <p>Qualidade: {numero.quality_rating ?? "não informada"}</p>
              </>
            )}
          </div>
        )}
        {d?.conectado && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="font-medium">Modelo de mensagem do aviso de entrega</p>
            {cfg?.modelo
              ? <p>{cfg.modelo} ({cfg.idioma}) — {modelo ? (MODELO_STATUS[modelo.status] ?? modelo.status) : d.modelo?.ok ? "não encontrado na Meta" : "situação não consultada"}{modelo?.rejected_reason && modelo.rejected_reason !== "NONE" ? ` · motivo: ${modelo.rejected_reason}` : ""}</p>
              : <p className="text-muted-foreground">Nenhum modelo configurado.</p>}
            {!modelo && (
              <Button size="sm" variant="outline" disabled={ocupado} onClick={() => executar(async () => {
                const r = await chamar({ acao: "criar_modelo" });
                return r.ok ? "Modelo enviado para aprovação da Meta." : `Meta recusou a criação [${r.http ?? "sem resposta"}]: ${JSON.stringify(r.dados)}`;
              })}>Criar modelo para aprovação</Button>
            )}
          </div>
        )}
        {d && (
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <Label htmlFor="wa-ativo">Envio automático ao atribuir entregas</Label>
              <p className="text-xs text-muted-foreground">Desligado, o pedido é atribuído e o aviso fica como "Falha" com o motivo, para tentar depois.</p>
            </div>
            <Switch id="wa-ativo" checked={!!cfg?.envio_ativo} disabled={ocupado} onCheckedChange={ativar} />
          </div>
        )}
        {d?.conectado && cfg?.modelo && (
          <div className="space-y-2 rounded-md border p-3">
            <Label htmlFor="wa-teste">Teste (envia 1 mensagem real com dados de exemplo; pode ser cobrada pela Meta)</Label>
            <div className="flex gap-2">
              <Input id="wa-teste" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="DDD + número autorizado para teste" />
              <Button disabled={ocupado || tel.replace(/\D/g, "").length < 10} onClick={() => executar(async () => {
                if (!window.confirm("Enviar 1 mensagem de teste para este número?")) return "Teste cancelado.";
                const r = await chamar({ acao: "testar", telefone: tel });
                return r.status === "enviado" ? "Teste enviado à plataforma." : `Teste não confirmado (${r.status}): ${r.erro ?? ""}`;
              })}>Testar</Button>
            </div>
          </div>
        )}
        {msg && <p>{msg}</p>}
      </CardContent>
    </Card>
  );
}
