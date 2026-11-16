import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export interface StatusDesktop {
  provedor: "meta" | "desktop";
  envio_ativo: boolean;
  telefone_esperado: string | null;
  dispositivo: null | {
    id: string; nome: string; estado: "connected" | "disconnected"; telefone: string | null; pausado: boolean;
    app_version: string | null; ultimo_contato: string | null; criado_em: string; pronto: boolean;
  };
}

export const ENDPOINT_DESKTOP = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-desktop`;
const quando = (t?: string | null) => (t ? new Date(t).toLocaleString("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "medium" }) : "nunca");
const fone = (t?: string | null) => (t ? `+${t}` : "—");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = async (fn: string, args?: Record<string, unknown>): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data;
};

export function useStatusDesktop() {
  return useQuery({ queryKey: ["whatsapp-desktop-status"], queryFn: () => rpc("whatsapp_desktop_status") as Promise<StatusDesktop>, refetchInterval: 15000 });
}

/** Escolha explícita do provedor dos avisos. Qualquer troca desliga o envio automático; não há troca automática entre eles. */
export function WhatsAppProvedor() {
  const qc = useQueryClient();
  const st = useStatusDesktop();
  const [msg, setMsg] = useState<string | null>(null);
  const trocar = async (p: string) => {
    if (p === st.data?.provedor) return;
    if (!window.confirm("Trocar o provedor DESLIGA o envio automático de avisos. Avisos ainda não enviados pelo Aplicativo do PC são cancelados. Continuar?")) return;
    setMsg(null);
    try { await rpc("whatsapp_provedor_definir", { _provedor: p }); setMsg("Provedor trocado. O envio automático está desligado."); }
    catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { qc.invalidateQueries({ queryKey: ["whatsapp-desktop-status"] }); qc.invalidateQueries({ queryKey: ["whatsapp-admin-status"] }); }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provedor dos avisos de entrega</CardTitle>
        <CardDescription>Só um provedor envia. Sem troca automática entre eles: se o escolhido não puder enviar, o aviso fica como “Falha” ou “Incerto”.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {st.isError && <p className="text-destructive">{(st.error as Error).message}</p>}
        {st.data && (
          <RadioGroup value={st.data.provedor} onValueChange={trocar} className="gap-3">
            <div className="flex items-center gap-2"><RadioGroupItem value="meta" id="prov-meta" /><Label htmlFor="prov-meta">API oficial da Meta</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="desktop" id="prov-desktop" /><Label htmlFor="prov-desktop">Aplicativo do PC</Label></div>
          </RadioGroup>
        )}
        {msg && <p>{msg}</p>}
      </CardContent>
    </Card>
  );
}

/** Configurações > WhatsApp > Aplicativo do PC (só administrador). */
export function WhatsAppDesktopSettings() {
  const qc = useQueryClient();
  const st = useStatusDesktop();
  const d = st.data;
  const [tel, setTel] = useState("");
  const [config, setConfig] = useState<{ json: string; expira: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  if (!d || d.provedor !== "desktop") return null;

  const executar = async (fn: () => Promise<string | void>) => {
    setOcupado(true); setMsg(null);
    try { const r = await fn(); if (r) setMsg(r); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    finally { setOcupado(false); qc.invalidateQueries({ queryKey: ["whatsapp-desktop-status"] }); }
  };
  const disp = d.dispositivo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aplicativo do PC</CardTitle>
        <CardDescription>
          O aplicativo do Windows usa uma sessão própria do WhatsApp Web, sem mexer no WhatsApp do celular. Ele só faz chamadas de saída ao GásFácil; o QR code e a sessão nunca vêm para o servidor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2 rounded-md border p-3">
          <Label htmlFor="wd-tel">Número do WhatsApp esperado no PC</Label>
          <p>Atual: <strong>{fone(d.telefone_esperado)}</strong></p>
          <div className="flex gap-2">
            <Input id="wd-tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="DDD + número" inputMode="tel" />
            <Button variant="outline" disabled={ocupado || tel.replace(/\D/g, "").length < 10} onClick={() => executar(async () => {
              if (d.telefone_esperado && !window.confirm("Trocar o número esperado desliga o envio automático. Continuar?")) return;
              await rpc("whatsapp_desktop_telefone_definir", { _telefone: tel }); setTel("");
              return "Número salvo. O envio automático está desligado.";
            })}>Salvar</Button>
          </div>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium">Dispositivo</p>
          {!disp && <p className="text-muted-foreground">Nenhum aplicativo do PC pareado.</p>}
          {disp && (
            <div className="space-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <strong>{disp.nome}</strong>
                {disp.pronto ? <Badge>Pronto para enviar</Badge> : <Badge variant="outline">Não pronto</Badge>}
                <Badge variant={disp.estado === "connected" ? "secondary" : "destructive"}>{disp.estado === "connected" ? "WhatsApp conectado" : "WhatsApp desconectado"}</Badge>
                {disp.pausado && <Badge variant="destructive">Pausado no PC</Badge>}
              </p>
              <p>Número no PC: {fone(disp.telefone)}{disp.telefone && d.telefone_esperado && disp.telefone !== d.telefone_esperado ? " — diferente do esperado: nada será enviado" : ""}</p>
              <p>Último contato: {quando(disp.ultimo_contato)} · versão {disp.app_version ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Envia só com: provedor “Aplicativo do PC” ligado, número esperado = número no PC, conectado, sem pausa e com contato nos últimos 45 segundos.</p>
              <Button size="sm" variant="destructive" disabled={ocupado} onClick={() => executar(async () => {
                if (!window.confirm("Revogar este PC? O acesso dele acaba na hora e o envio automático é desligado.")) return;
                await rpc("whatsapp_desktop_revogar"); return "PC revogado. O envio automático está desligado.";
              })}>Revogar</Button>
            </div>
          )}
          {!disp && (
            <Button size="sm" disabled={ocupado || !d.telefone_esperado} onClick={() => executar(async () => {
              const r = await rpc("whatsapp_desktop_gerar_pareamento");
              setConfig({ json: JSON.stringify({ endpoint: ENDPOINT_DESKTOP, pairing_code: r.pairing_code }, null, 2), expira: r.expira_em });
            })}>Gerar configuração</Button>
          )}
          {!disp && !d.telefone_esperado && <p className="text-xs text-muted-foreground">Informe o número esperado antes de gerar a configuração.</p>}
          {config && (
            <div className="space-y-2 rounded-md bg-muted p-2">
              <p className="font-medium">Configuração para o aplicativo do PC (aparece só agora; vale até {quando(config.expira)} e pode ser usada uma vez)</p>
              <Textarea aria-label="Configuração do aplicativo do PC" readOnly value={config.json} rows={4} className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(config.json).then(() => setMsg("Configuração copiada."), () => setMsg("Não foi possível copiar; selecione o texto."))}>Copiar</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfig(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="wd-ativo">Envio automático pelo Aplicativo do PC</Label>
              <p className="text-xs text-muted-foreground">Desligado, o pedido é atribuído e o aviso fica como “Falha” com o motivo. Desligar cancela avisos que ainda não começaram. Pedidos antigos e avisos da Meta nunca passam para o PC.</p>
            </div>
            <Switch id="wd-ativo" checked={d.envio_ativo} disabled={ocupado || (!d.envio_ativo && !disp)} onCheckedChange={(v) => executar(async () => {
              if (v && !window.confirm("Ligar o envio automático pelo Aplicativo do PC? Os avisos de novas atribuições serão enviados pelo WhatsApp aberto no PC.")) return;
              await rpc("whatsapp_desktop_ativar", { _ativo: v });
              return v ? "Envio pelo Aplicativo do PC ligado." : "Envio pelo Aplicativo do PC desligado.";
            })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">“Só WhatsApp”, respostas do entregador e as situações “Entregue”/“Lido” continuam indisponíveis.</p>
        {msg && <p>{msg}</p>}
      </CardContent>
    </Card>
  );
}
