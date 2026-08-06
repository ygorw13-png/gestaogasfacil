import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:notificacoes@gasflow.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.slice(0, 120) : "Gás Control";
    const message = typeof body.body === "string" ? body.body.slice(0, 300) : "";
    const url = typeof body.url === "string" ? body.url.slice(0, 300) : "/entregador/entregas";
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];
    const deliveryPersonName: string | null =
      typeof body.deliveryPersonName === "string" ? body.deliveryPersonName : null;

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    const orgId = senderProfile?.organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "Organização não encontrada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targets = userIds;
    if (deliveryPersonName) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("organization_id", orgId)
        .ilike("name", deliveryPersonName);
      targets = (profiles ?? []).map((p: { id: string }) => p.id);
    }

    if (targets.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "sem destinatários" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("organization_id", orgId)
      .in("user_id", targets);

    const payload = JSON.stringify({ title, body: message, url, tag: "entrega" });
    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      (subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent += 1;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) stale.push(s.id);
        }
      }),
    );

    if (stale.length) await supabase.from("push_subscriptions").delete().in("id", stale);

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error", err);
    return new Response(JSON.stringify({ error: "Falha ao enviar notificação" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
