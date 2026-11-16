import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { WhatsAppQrSettings } from "./WhatsAppQrSettings";

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

const CUSTO = "A Meta cobra cada aviso entregue (modelo de utilidade). Tabela da Meta para o Brasil em 1/10/2026: cerca de US$ 0,0068 por mensagem entregue, cobrada pela Meta na conta da empresa; confira a tabela atual da Meta antes de ativar.";

const MODELO_STATUS: Record<string, string> = { APPROVED: "Aprovado", PENDING: "Em análise pela Meta", REJECTED: "Recusado", PAUSED: "Pausado", DISABLED: "Desativado" };

/** Configurações > WhatsApp (só administrador). Mostra só o que a plataforma responde; nada é simulado. */
export function WhatsAppSettings() {
  const qc = useQueryClient();
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
    if (v && !window.confirm(`${CUSTO} Ativar o envio automático?`)) return "Envio não ativado.";
    const r = await chamar({ acao: "ativar", ativo: v });
    return r?.envio_ativo ? "Envio automático ativado." : "Envio automático desativado.";
  });
  const teste = d?.ambiente === "teste";
  const producao = d?.ambiente === "producao";

  return (
    <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp da empresa</CardTitle>
        <CardDescription>API oficial do WhatsApp Business. Credenciais ficam só no servidor. Somente o administrador vê esta área.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {st.isLoading && <p className="text-muted-foreground">Consultando a conexão…</p>}
        {st.isError && <p className="text-destructive">{(st.error as Error).message}</p>}
        {d && !d.conectado && <p><Badge variant="destructive">Não conectado</Badge> {d.motivo}</p>}
        {d && (!d.conectado || !producao) && (
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <p className="font-medium">Como conectar o número real da empresa (mantendo o WhatsApp Business no celular)</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>No celular, o número precisa estar no app <strong>WhatsApp Business</strong> (não no WhatsApp comum), atualizado (versão 2.24.17 ou mais nova).</li>
              <li>No Lovable, abra <strong>Conectores → WhatsApp Business → Nova conexão</strong> e entre com o Facebook de quem administra a empresa na Meta (com e-mail e telefone verificados).</li>
              <li>Quando a Meta perguntar, escolha <strong>conectar o número do app WhatsApp Business existente</strong> e leia o QR code pelo app do celular. Assim o celular continua funcionando e nenhuma conversa é apagada.</li>
              <li>Ligue essa nova conexão ao GásFácil, no lugar da conexão de teste. Esta tela passa a mostrar “Número real da empresa”.</li>
              <li>Crie aqui o modelo de mensagem e aguarde a aprovação da Meta (pode levar até 48 h).</li>
            </ol>
          </div>
        )}
        {d?.conectado && (
          <div className="space-y-1">
            <p>
              {teste ? <Badge variant="destructive">Número de teste da Meta — não é o número da empresa</Badge>
                : producao ? <Badge>Número real da empresa</Badge>
                : <Badge variant="outline">Conectado, número não confirmado</Badge>}{" "}
              {d.numero?.ok ? "" : `Consulta do número falhou [${d.numero?.http ?? "sem resposta"}]`}
            </p>
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
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="wa-ativo">Envio automático ao atribuir entregas</Label>
                <p className="text-xs text-muted-foreground">Desligado, o pedido é atribuído e o aviso fica como "Falha" com o motivo, para tentar depois. Pedidos antigos nunca recebem aviso automático.</p>
              </div>
              <Switch id="wa-ativo" checked={!!cfg?.envio_ativo} disabled={ocupado || (!cfg?.envio_ativo && !!(d.motivo_nao_ativar ?? !d.conectado))} onCheckedChange={ativar} />
            </div>
            {!cfg?.envio_ativo && (d.motivo_nao_ativar || !d.conectado) && <p className="text-xs text-muted-foreground">Ainda não pode ser ligado: {d.motivo_nao_ativar ?? "WhatsApp não conectado."}</p>}
            <p className="text-xs text-muted-foreground">Custo: {CUSTO}</p>
          </div>
        )}
        {d && (
          <div className="space-y-1 rounded-md border p-3">
            <p className="font-medium">“Só WhatsApp” e respostas do entregador</p>
            <p className="text-xs text-muted-foreground">Aceitar/recusar pelo WhatsApp e as situações “Entregue” e “Lido” dependem de o GásFácil receber respostas da Meta, o que esta versão do sistema ainda não faz. Até lá, “Só WhatsApp” fica indisponível na atribuição.</p>
          </div>
        )}
        {d?.conectado && cfg?.modelo && (
          <div className="space-y-2 rounded-md border p-3">
            <Label htmlFor="wa-teste">Teste controlado: envia 1 mensagem com dados de exemplo ao número que você digitar{teste ? " (número de teste da Meta: só chega a destinatários cadastrados como teste na Meta)" : "; pode ser cobrada pela Meta"}</Label>
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
    <WhatsAppQrSettings />
    </div>
  );
}
