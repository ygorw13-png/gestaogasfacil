import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error("Sessão inválida");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Apenas administradores");

    const { action, target_user_id, new_password, active } = await req.json();
    if (!target_user_id) throw new Error("target_user_id obrigatório");

    // Verify same organization
    const { data: caller } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    const { data: target } = await admin.from("profiles").select("organization_id").eq("id", target_user_id).single();
    if (!caller || !target || caller.organization_id !== target.organization_id) {
      throw new Error("Usuário não pertence à sua organização");
    }

    if (action === "reset_password") {
      if (!new_password || new_password.length < 8) throw new Error("Senha deve ter no mínimo 8 caracteres");
      const { error } = await admin.auth.admin.updateUserById(target_user_id, { password: new_password });
      if (error) throw error;
    } else if (action === "toggle_active") {
      await admin.from("profiles").update({ ativo: !!active }).eq("id", target_user_id);
      // Also ban/unban auth user
      await admin.auth.admin.updateUserById(target_user_id, {
        ban_duration: active ? "none" : "876000h", // 100 years
      });
    } else if (action === "delete") {
      if (target_user_id === user.id) throw new Error("Você não pode excluir a si mesmo");
      const { error } = await admin.auth.admin.deleteUser(target_user_id);
      if (error) throw error;
    } else {
      throw new Error("Ação inválida");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("manage-user error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
