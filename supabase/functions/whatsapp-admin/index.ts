// Configurações > WhatsApp (só administrador): situação real da conexão, modelo de mensagem e teste.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { ambienteNumero, motivoNaoAtivar, classificar, corpoModelo, EXEMPLO_MODELO, GATEWAY_URL, MODELO_PADRAO, TEXTO_MODELO } from "../_shared/whatsapp-core.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function gw(method: string, path: string, body?: unknown) {
  try {
    const r = await fetch(`${GATEWAY_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": WHATSAPP_API_KEY!, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const texto = await r.text();
    let dados: any = null;
    try { dados = JSON.parse(texto); } catch { dados = texto; }
    if (!r.ok) console.error(`WhatsApp ${path} [${r.status}]: ${texto}`);
    return { http: r.status, ok: r.ok, dados, texto };
  } catch (e) {
    return { http: null, ok: false, dados: null, texto: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!/^Bearer\s+\S+/i.test(auth)) return json({ error: "Não autenticado" }, 401);
    const usuario = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: u } = await usuario.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!u?.user) return json({ error: "Sessão inválida" }, 401);
    const [{ data: ehAdmin }, { data: org }] = await Promise.all([usuario.rpc("is_admin"), usuario.rpc("get_my_org")]);
    if (!ehAdmin || !org) return json({ error: "Só o administrador" }, 403);

    const body = await req.json().catch(() => ({}));
    const acao = String(body?.acao ?? "status");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: cfg } = await admin.from("whatsapp_config").select("modelo, idioma, envio_ativo").eq("organization_id", org).maybeSingle();
    const conectado = !!(LOVABLE_API_KEY && WHATSAPP_API_KEY);
    if (!conectado) {
      if (acao === "ativar" && body?.ativo !== true) {
        await admin.from("whatsapp_config").upsert({ organization_id: org, envio_ativo: false, atualizado_por: u.user.id, atualizado_em: new Date().toISOString() });
        return json({ ok: true, envio_ativo: false });
      }
      return json({ conectado: false, motivo: "WhatsApp Business da empresa ainda não conectado ao GásFácil", config: cfg });
    }

    const consultar = async () => {
      const numero = await gw("GET", "/phone_number?fields=display_phone_number,verified_name,quality_rating,is_on_biz_app,platform_type,name_status,account_mode");
      const modelo = cfg?.modelo
        ? await gw("GET", `/message_templates?name=${encodeURIComponent(cfg.modelo)}&fields=name,status,language,category,rejected_reason`)
        : null;
      const ambiente = numero.ok ? ambienteNumero(numero.dados) : "desconhecido";
      const statusModelo: string | null = modelo?.ok ? (modelo.dados?.data?.[0]?.status ?? null) : null;
      return { numero, modelo, ambiente, statusModelo };
    };
    if (acao === "status") {
      const { numero, modelo, ambiente, statusModelo } = await consultar();
      return json({ conectado: true, ambiente, config: cfg, numero: { ok: numero.ok, http: numero.http, dados: numero.dados },
        modelo: modelo ? { ok: modelo.ok, http: modelo.http, dados: modelo.dados } : null,
        motivo_nao_ativar: motivoNaoAtivar(ambiente, statusModelo) });
    }
    if (acao === "ativar") {
      const ligar = body?.ativo === true;
      if (ligar) {
        const { ambiente, statusModelo } = await consultar();
        const motivo = motivoNaoAtivar(ambiente, statusModelo);
        if (motivo) return json({ ok: false, error: motivo }, 409);
      }
      const { error } = await admin.from("whatsapp_config").upsert({ organization_id: org, envio_ativo: ligar, atualizado_por: u.user.id, atualizado_em: new Date().toISOString() });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, envio_ativo: ligar });
    }
    if (acao === "criar_modelo") {
      const nome = MODELO_PADRAO;
      const r = await gw("POST", "/message_templates", {
        name: nome, language: "pt_BR", category: "UTILITY",
        components: [{ type: "BODY", text: TEXTO_MODELO, example: { body_text: [EXEMPLO_MODELO] } }],
      });
      if (r.ok || /already exists|existe/i.test(r.texto)) {
        await admin.from("whatsapp_config").upsert({ organization_id: org, modelo: nome, idioma: "pt_BR", atualizado_por: u.user.id, atualizado_em: new Date().toISOString() });
      }
      return json({ ok: r.ok, http: r.http, dados: r.dados });
    }
    if (acao === "testar") {
      const tel = String(body?.telefone ?? "").replace(/\D/g, "").replace(/^0+/, "");
      const telefone = tel.startsWith("55") && tel.length >= 12 ? tel : `55${tel}`;
      if (telefone.length < 12 || telefone.length > 13) return json({ error: "Telefone de teste inválido" }, 400);
      if (!cfg?.modelo) return json({ error: "Configure o modelo antes do teste" }, 400);
      let r;
      try {
        const resp = await fetch(`${GATEWAY_URL}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": WHATSAPP_API_KEY!, "Content-Type": "application/json" },
          body: JSON.stringify(corpoModelo(telefone, cfg.modelo, cfg.idioma || "pt_BR", EXEMPLO_MODELO.map((v, i) => i === 0 ? "#TESTE" : v))),
          signal: AbortSignal.timeout(15000),
        });
        r = classificar(resp.status, await resp.text());
      } catch (e) {
        r = classificar(null, e instanceof Error ? e.message : String(e));
      }
      return json(r);
    }
    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("whatsapp-admin:", msg);
    return json({ error: msg }, 500);
  }
});
