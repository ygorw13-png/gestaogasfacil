import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Evolution API (conexão por QR code, servidor próprio)
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");

// Provedor genérico (BotBot.chat, Z-API, UltraMsg, Chat-API, etc.)
// WHATSAPP_API_URL: endpoint completo de envio de texto
// WHATSAPP_API_KEY: token (enviado como Bearer e também em apikey/token)
// WHATSAPP_API_FORMAT: nomes dos campos, ex "phone:message" (padrão) ou "number:text"
const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");
const WHATSAPP_API_FORMAT = Deno.env.get("WHATSAPP_API_FORMAT") ?? "phone:message";

// Twilio (WhatsApp Business API oficial, via connector gateway)
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string): string | null {
  let d = (phone || "").replace(/\D/g, "");
  if (!d) return null;
  d = d.replace(/^0+/, "");
  if (!d.startsWith("55")) d = `55${d}`;
  if (d.length < 12 || d.length > 13) return null;
  return d;
}

function providerConfigured(): "evolution" | "custom" | "twilio" | null {
  if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE) return "evolution";
  if (WHATSAPP_API_URL) return "custom";
  if (LOVABLE_API_KEY && TWILIO_API_KEY && TWILIO_WHATSAPP_FROM) return "twilio";
  return null;
}

/** Envio por API HTTP genérica (BotBot.chat, Z-API, UltraMsg...). */
async function sendCustom(phone: string, text: string) {
  const [phoneField = "phone", msgField = "message"] = WHATSAPP_API_FORMAT.split(":");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (WHATSAPP_API_KEY) {
    headers.Authorization = `Bearer ${WHATSAPP_API_KEY}`;
    headers.apikey = WHATSAPP_API_KEY;
    headers.token = WHATSAPP_API_KEY;
  }
  const res = await fetch(WHATSAPP_API_URL!, {
    method: "POST",
    headers,
    body: JSON.stringify({ [phoneField]: phone, [msgField]: text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${body}`);
  try {
    const j = JSON.parse(body);
    return j?.id ?? j?.messageId ?? j?.key?.id ?? null;
  } catch {
    return null;
  }
}


async function sendEvolution(phone: string, text: string) {
  const base = EVOLUTION_API_URL!.replace(/\/+$/, "");
  const res = await fetch(`${base}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { apikey: EVOLUTION_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ number: phone, text, textMessage: { text } }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${body}`);
  let id: string | undefined;
  try {
    id = JSON.parse(body)?.key?.id;
  } catch { /* resposta não-JSON */ }
  return id ?? null;
}

async function sendTwilio(phone: string, text: string) {
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: `whatsapp:+${phone}`,
      From: `whatsapp:${TWILIO_WHATSAPP_FROM!.startsWith("+") ? TWILIO_WHATSAPP_FROM : `+${TWILIO_WHATSAPP_FROM}`}`,
      Body: text,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${body}`);
  try {
    return JSON.parse(body)?.sid ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Sessão inválida" }, 401);
    const userId = userData.user.id;

    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    const orgId = profile?.organization_id;
    if (!orgId) return json({ error: "Usuário sem organização" }, 403);

    const payload = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(payload?.mensagens)
      ? payload.mensagens
      : [{ telefone: payload?.telefone, mensagem: payload?.mensagem, nome: payload?.nome, tipo: payload?.tipo, referencia_id: payload?.referencia_id }];

    const provider = providerConfigured();

    const results: Array<Record<string, unknown>> = [];

    for (const m of rawMessages) {
      const telefone = normalizePhone(String(m?.telefone ?? ""));
      const mensagem = String(m?.mensagem ?? "").trim();

      if (!telefone || !mensagem) {
        results.push({ ok: false, telefone: m?.telefone ?? null, erro: "Telefone ou mensagem inválidos" });
        continue;
      }

      if (!provider) {
        results.push({ ok: false, telefone, erro: "provider_nao_configurado", fallback: true });
        continue;
      }

      let status = "enviado";
      let erro: string | null = null;
      let providerId: string | null = null;

      try {
        providerId = provider === "evolution" ? await sendEvolution(telefone, mensagem) : await sendTwilio(telefone, mensagem);
      } catch (e) {
        status = "erro";
        erro = e instanceof Error ? e.message : String(e);
        console.error("Falha ao enviar WhatsApp:", erro);
      }

      await admin.from("whatsapp_mensagens").insert({
        organization_id: orgId,
        telefone,
        destinatario_nome: m?.nome ?? null,
        tipo: m?.tipo ?? "manual",
        mensagem,
        status,
        provedor: provider,
        provider_message_id: providerId,
        erro,
        referencia_id: m?.referencia_id ?? null,
        enviado_por: userId,
        enviado_em: status === "enviado" ? new Date().toISOString() : null,
      });

      results.push({ ok: status === "enviado", telefone, erro, provider });
    }

    const enviados = results.filter((r) => r.ok).length;
    return json({ provider, enviados, total: results.length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("enviar-whatsapp:", msg);
    return json({ error: msg }, 500);
  }
});
