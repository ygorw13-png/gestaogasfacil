import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Aviso de entrega por Web Push.
 * - tipo "atribuicao": quem chama é operador/administrador; o destinatário é LIDO DO BANCO
 *   (orders.delivery_person_id da mesma empresa, status 'assigned'), nunca enviado pela tela.
 *   Na reatribuição, vai para o novo responsável. Tag por pedido = um aviso por pedido no aparelho.
 * - tipo "teste": só para as inscrições da própria conta.
 */
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:notificacoes@gasflow.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function enviar(orgId: string, userId: string, payload: Record<string, unknown>) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("organization_id", orgId)
    .eq("user_id", userId);
  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 30, urgency: "high" },
        );
        sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.id);
        else console.error("push falhou", status);
      }
    }),
  );
  if (stale.length) await supabase.from("push_subscriptions").delete().in("id", stale);
  return { sent, inscricoes: (subs ?? []).length - stale.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const uid = userData?.user?.id;
    if (!uid) return json({ error: "Não autenticado" }, 401);

    const { data: perfil } = await supabase
      .from("profiles").select("organization_id, ativo").eq("id", uid).maybeSingle();
    const orgId = perfil?.organization_id as string | undefined;
    if (!orgId || perfil?.ativo === false) return json({ error: "Conta sem empresa ativa" }, 403);

    const body = await req.json().catch(() => ({}));
    const tipo = body?.tipo;

    if (tipo === "teste") {
      const r = await enviar(orgId, uid, {
        title: "Teste de aviso — GásFácil",
        body: "Se você viu e ouviu este aviso, as notificações estão funcionando neste aparelho.",
        url: "/entregador/entregas",
        tag: "teste-aviso",
      });
      return json(r);
    }

    if (tipo === "atribuicao") {
      const orderId = String(body?.orderId ?? "");
      if (!UUID.test(orderId)) return json({ error: "Pedido inválido" }, 400);
      const { data: papeis } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const operador = (papeis ?? []).some((p: { role: string }) => p.role === "admin" || p.role === "user");
      if (!operador) return json({ error: "Sem permissão" }, 403);

      const { data: pedido } = await supabase
        .from("orders")
        .select("id, status, delivery_person_id, client_name, product, quantity, address")
        .eq("id", orderId).eq("organization_id", orgId).maybeSingle();
      if (!pedido) return json({ error: "Pedido não encontrado" }, 404);
      // Só avisa o que está confirmado no banco: atribuída e aguardando aceite.
      if (pedido.status !== "assigned" || !pedido.delivery_person_id) {
        return json({ sent: 0, motivo: "pedido não está aguardando aceite" });
      }
      const end = (pedido.address ?? {}) as Record<string, string>;
      const local = [end.street, end.number, end.neighborhood].filter(Boolean).join(", ");
      const r = await enviar(orgId, pedido.delivery_person_id, {
        title: "Nova entrega para você",
        body: `${pedido.client_name ?? "Cliente"} — ${pedido.quantity ?? 1}x ${pedido.product ?? ""}${local ? ` • ${local}` : ""}`.slice(0, 300),
        url: `/entregador/entregas?pedido=${pedido.id}`,
        tag: `entrega-${pedido.id}`,
        orderId: pedido.id,
      });
      return json(r);
    }

    return json({ error: "Tipo de aviso inválido" }, 400);
  } catch (err) {
    console.error("send-push error", err);
    return json({ error: "Falha ao enviar notificação" }, 500);
  }
});
