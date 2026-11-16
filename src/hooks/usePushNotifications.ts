import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { desbloquearSom } from "@/utils/deliveryAlert";

const VAPID_PUBLIC_KEY =
  "BDXuckiu2iTfRuf6CNPk0y-LQeiYT1--UEeF8yE6A2lPpYrdTKVxK2ORIi1TAgHqyyZSmS8QnL1sd_541uNoveM";

/** Escopo próprio: o modo offline (sw.js) fica com "/" e um não substitui o outro. */
export const PUSH_SW_URL = "/push-sw.js";
export const PUSH_SCOPE = "/push/";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

const isSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** iPhone/iPad só recebe avisos com o app instalado na tela de início (iOS 16.4+). */
export const ehIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);

/** Versão antiga registrava o push-sw.js no escopo "/", tomando o lugar do modo offline. */
async function limparRegistroAntigo() {
  const regs = await navigator.serviceWorker.getRegistrations();
  const raiz = `${window.location.origin}/`;
  for (const r of regs) {
    const script = r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || "";
    if (r.scope === raiz && script.endsWith(PUSH_SW_URL)) {
      const sub = await r.pushManager.getSubscription().catch(() => null);
      if (sub) {
        await (supabase.from("push_subscriptions") as any).delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe().catch(() => undefined);
      }
      await r.unregister().catch(() => undefined);
    }
  }
}

async function registrar() {
  await limparRegistroAntigo();
  const reg = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SCOPE });
  // Espera ficar ativo (o "ready" global se refere ao escopo da página, não a este).
  if (!reg.active) {
    await new Promise<void>((resolve) => {
      const sw = reg.installing || reg.waiting;
      if (!sw) return resolve();
      sw.addEventListener("statechange", () => sw.state === "activated" && resolve());
      setTimeout(resolve, 5000);
    });
  }
  return reg;
}

/** Grava a inscrição deste aparelho para a conta logada (troca de conta = inscrição nova). */
async function salvarInscricao(reg: ServiceWorkerRegistration, sub: PushSubscription): Promise<PushSubscription> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Sessão encerrada. Entre novamente.");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", userId).maybeSingle();
  if (!profile?.organization_id) throw new Error("Conta sem empresa.");
  const gravar = async (s: PushSubscription) => {
    const j = s.toJSON() as { endpoint?: string; keys?: Record<string, string> };
    return (supabase.from("push_subscriptions") as any).upsert(
      { user_id: userId, organization_id: profile.organization_id, endpoint: j.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth, user_agent: navigator.userAgent },
      { onConflict: "endpoint" },
    );
  };
  const { error } = await gravar(sub);
  if (!error) return sub;
  // Endereço deste aparelho ainda ligado a outra conta: cria um novo só para esta conta.
  await sub.unsubscribe().catch(() => undefined);
  const nova = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
  const { error: e2 } = await gravar(nova);
  if (e2) throw e2;
  return nova;
}

export type EstadoAviso = "sem_suporte" | "ios_instalar" | "negado" | "pedir" | "ativo";

export function usePushNotifications() {
  const { toast } = useToast();
  const [supported] = useState(isSupported);
  const [permission, setPermission] = useState<NotificationPermission>(isSupported() ? Notification.permission : "denied");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ao abrir: com permissão já dada, confere a inscrição deste aparelho para a conta atual.
  useEffect(() => {
    if (!supported || Notification.permission !== "granted") return;
    let vivo = true;
    (async () => {
      try {
        const reg = await registrar();
        const sub = await reg.pushManager.getSubscription();
        if (sub) await salvarInscricao(reg, sub);
        if (vivo) setSubscribed(!!sub);
      } catch {
        if (vivo) setSubscribed(false);
      }
    })();
    return () => { vivo = false; };
  }, [supported]);

  const subscribe = useCallback(async () => {
    // Toque do usuário: libera o som do alerta em primeiro plano.
    desbloquearSom();
    if (!supported) {
      toast({ title: "Avisos não disponíveis", description: ehIOS() ? "No iPhone, instale o app na tela de início e abra por ele." : "Este navegador não recebe avisos em segundo plano.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast({ title: "Notificações bloqueadas", description: "Libere as notificações deste site nas configurações do navegador e tente de novo.", variant: "destructive" });
        return false;
      }
      const reg = await registrar();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
      await salvarInscricao(reg, sub);
      setSubscribed(true);
      toast({ title: "Notificações ativadas", description: "Toque em “Testar aviso” para conferir som e vibração." });
      return true;
    } catch (err) {
      console.error("Erro ao ativar push:", err);
      toast({ title: "Não foi possível ativar", description: err instanceof Error ? err.message : "Tente de novo.", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, toast]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(PUSH_SCOPE);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await (supabase.from("push_subscriptions") as any).delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast({ title: "Notificações desativadas" });
    } finally {
      setLoading(false);
    }
  }, [supported, toast]);

  /** Envia um aviso real pelo servidor para esta conta (chega mesmo com o app em segundo plano). */
  const testar = useCallback(async () => {
    desbloquearSom();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", { body: { tipo: "teste" } });
      if (error) throw error;
      if (!data?.sent) {
        toast({ title: "Aviso não enviado", description: "Este aparelho não está inscrito. Toque em “Ativar notificações”.", variant: "destructive" });
        return false;
      }
      toast({ title: "Aviso de teste enviado", description: "Deve aparecer em alguns segundos. Teste também com o app fechado e a tela bloqueada." });
      return true;
    } catch {
      toast({ title: "Falha no teste", description: "Sem resposta do servidor. Confira a internet e tente de novo.", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const estado: EstadoAviso = !supported
    ? (ehIOS() && !instalado() ? "ios_instalar" : "sem_suporte")
    : permission === "denied" ? "negado"
    : permission === "granted" && subscribed ? "ativo"
    : "pedir";

  return { supported, permission, subscribed, loading, subscribe, unsubscribe, testar, estado };
}

/** Mostra uma notificação local pelo worker de avisos (Android não aceita `new Notification` na página). */
export async function mostrarAvisoLocal(titulo: string, corpo: string, tag: string, url = "/entregador/entregas") {
  if (!isSupported() || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.getRegistration(PUSH_SCOPE).catch(() => undefined);
  await reg?.showNotification(titulo, {
    body: corpo, tag, icon: "/icon-192.png", badge: "/icon-192.png", requireInteraction: true,
    data: { url }, vibrate: [300, 100, 300], renotify: true,
  } as NotificationOptions).catch(() => undefined);
}

/** Toque na notificação com o app aberto: o worker manda a URL do pedido e a tela navega até ele. */
export function useAbrirPedidoDoAviso() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { tipo?: string; url?: string } | null;
      if (d?.tipo === "abrir-pedido" && typeof d.url === "string" && d.url.startsWith("/")) navigate(d.url);
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [navigate]);
}
