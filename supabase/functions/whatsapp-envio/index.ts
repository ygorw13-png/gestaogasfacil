// Envia, pelo WhatsApp oficial, os avisos de entrega já gravados na fila (whatsapp_envios).
// Chamada pela tela depois que a atribuição foi confirmada no banco. Nunca cria atribuição.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { classificar, corpoModelo, GATEWAY_URL, impedimento, parametrosAviso } from "../_shared/whatsapp-core.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!/^Bearer\s+\S+/i.test(auth)) return json({ error: "Não autenticado" }, 401);
    const usuario = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await usuario.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!u?.user) return json({ error: "Sessão inválida" }, 401);
    const [{ data: operador }, { data: org }] = await Promise.all([usuario.rpc("is_operador"), usuario.rpc("get_my_org")]);
    if (!operador || !org) return json({ error: "Sem permissão" }, 403);

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.order_id === "string" && UUID.test(body.order_id) ? body.order_id : null;
    const envioId = typeof body?.envio_id === "string" && UUID.test(body.envio_id) ? body.envio_id : null;
    const confirmar = body?.confirmar_incerto === true;
    if (!orderId && !envioId) return json({ error: "Informe order_id ou envio_id" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    let q = admin.from("whatsapp_envios").select("id, status").eq("organization_id", org);
    q = envioId ? q.eq("id", envioId) : q.eq("order_id", orderId!).eq("status", "aguardando");
    const { data: envios, error } = await q;
    if (error) throw error;
    if (envioId && !envios?.length) return json({ error: "Envio não encontrado" }, 404);

    const { data: cfg } = await admin.from("whatsapp_config").select("modelo, idioma, envio_ativo").eq("organization_id", org).maybeSingle();
    const conectado = !!(LOVABLE_API_KEY && WHATSAPP_API_KEY);
    const resultados: unknown[] = [];

    for (const e of envios ?? []) {
      const { data: res, error: rErr } = await admin.rpc("whatsapp_envio_reservar", { _envio: e.id, _confirmar_incerto: confirmar });
      if (rErr) throw rErr;
      if (!res?.ok) { resultados.push({ envio_id: e.id, status: "nao_enviado", motivo: res?.motivo }); continue; }
      const imp = impedimento(cfg, conectado);
      let r;
      if (imp) {
        r = { status: "falha" as const, id: null, erro: imp };
      } else {
        try {
          const resp = await fetch(`${GATEWAY_URL}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": WHATSAPP_API_KEY!, "Content-Type": "application/json" },
            body: JSON.stringify(corpoModelo(res.telefone, cfg!.modelo!, cfg!.idioma || "pt_BR", parametrosAviso(res.order))),
            signal: AbortSignal.timeout(15000),
          });
          const texto = await resp.text();
          if (!resp.ok) console.error(`WhatsApp [${resp.status}]: ${texto}`);
          r = classificar(resp.status, texto);
        } catch (err) {
          r = classificar(null, err instanceof Error ? err.message : String(err));
        }
      }
      const { error: fErr } = await admin.rpc("whatsapp_envio_resultado", { _envio: e.id, _status: r.status, _provider_id: r.id, _erro: r.erro });
      if (fErr) throw fErr;
      resultados.push({ envio_id: e.id, status: r.status, erro: r.erro });
    }
    return json({ resultados });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("whatsapp-envio:", msg);
    return json({ error: msg }, 500);
  }
});
