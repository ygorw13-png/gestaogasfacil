import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUTOS = ["P13", "P20", "P45", "agua"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const hoje = new Date().toISOString().slice(0, 10);

    const { data: movs, error } = await supabase
      .from("movimentacoes_portaria")
      .select("organization_id, produto, delta_cheios, delta_vazios, delta_emprestados, tipo, data_operacao")
      .lt("data_operacao", hoje)
      .gte("data_operacao", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

    if (error) throw error;

    // Agrupa por organização + dia
    const grupos = new Map<string, any[]>();
    (movs || []).forEach((m: any) => {
      const key = `${m.organization_id}|${m.data_operacao}`;
      grupos.set(key, [...(grupos.get(key) || []), m]);
    });

    const inserts: any[] = [];

    for (const [key, rows] of grupos) {
      const [orgId, data] = key.split("|");
      if (rows.some((r) => r.tipo === "fechamento")) continue;

      const { data: org } = await supabase
        .from("organizations")
        .select("owner_id")
        .eq("id", orgId)
        .maybeSingle();
      if (!org) continue;

      for (const p of PRODUTOS) {
        const doProduto = rows.filter((r) => r.produto === p);
        if (doProduto.length === 0) continue;
        const cheios = doProduto.reduce((s, r) => s + (r.delta_cheios || 0), 0);
        const vazios = doProduto.reduce((s, r) => s + (r.delta_vazios || 0), 0);

        inserts.push({
          organization_id: orgId,
          tipo: "fechamento",
          produto: p,
          delta_cheios: 0,
          delta_vazios: 0,
          delta_emprestados: 0,
          data_operacao: data,
          registrado_por: org.owner_id,
          registrado_por_nome: "Sistema (automático)",
          observacoes: `Fechamento automático: ${cheios} cheios / ${vazios} vazios`,
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from("movimentacoes_portaria").insert(inserts);
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ ok: true, fechamentos: inserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fechamento-automatico erro", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
