// Configurações > WhatsApp > Conectar por QR (opcional, só administrador). Consulta um servidor Evolution API
// externo definido apenas nos secrets EVOLUTION_API_URL e EVOLUTION_API_KEY. Não envia mensagens.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { configServidor, executarAcao } from "../_shared/whatsapp-qr-core.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!/^Bearer\s+\S+/i.test(auth)) return json({ error: "Não autenticado" }, 401);
    const usuario = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await usuario.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!u?.user) return json({ error: "Sessão inválida" }, 401);
    const [{ data: ehAdmin }, { data: org }] = await Promise.all([usuario.rpc("is_admin"), usuario.rpc("get_my_org")]);
    const body = await req.json().catch(() => ({}));
    const r = await executarAcao({
      acao: body?.acao, org: typeof org === "string" ? org : null, ehAdmin: ehAdmin === true,
      servidor: configServidor({ url: Deno.env.get("EVOLUTION_API_URL"), chave: Deno.env.get("EVOLUTION_API_KEY") }),
      busca: fetch, agora: Date.now(),
    });
    return json(r.body, r.status);
  } catch (e) {
    console.error("whatsapp-qr:", e instanceof Error ? e.message : String(e));
    return json({ error: "Falha interna" }, 500);
  }
});
