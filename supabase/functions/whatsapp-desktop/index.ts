// Endpoint do "Aplicativo do PC" (protocolo 1). verify_jwt=false: o chamador é sempre validado aqui,
// por código de pareamento de uso único (pair) ou token de dispositivo (Bearer), ambos comparados por hash no banco.
import { createClient } from "npm:@supabase/supabase-js@2";
import { HEADERS, processar } from "../_shared/whatsapp-desktop-core.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  try {
    const origem = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
    const corpo = req.method === "POST" ? await req.text() : "";
    const s = await processar(
      { method: req.method, authorization: req.headers.get("Authorization"), corpo, origem },
      async (fn, args) => { const r = await admin.rpc(fn, args); return { data: r.data, error: r.error }; },
    );
    return new Response(JSON.stringify(s.body), { status: s.status, headers: HEADERS });
  } catch (e) {
    console.error("whatsapp-desktop:", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500, headers: HEADERS });
  }
});
