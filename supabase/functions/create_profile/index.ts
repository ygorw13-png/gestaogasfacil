
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { user_id, name, role, created_by_admin, organization_id } = await req.json()

    if (!user_id || !name) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: user_id and name are required."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      )
    }

    // Verificar se o perfil já existe
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existingProfile) {
      // Se o perfil já existe, retornar uma resposta de sucesso
      // para evitar erros no processo de registro
      return new Response(
        JSON.stringify({
          message: "Profile already exists",
          user_id: user_id
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    // Se o usuário for criado por um admin, usamos o organization_id fornecido,
    // caso contrário, criamos uma nova organização para este usuário
    let userOrganizationId = organization_id;
    
    if (!created_by_admin) {
      // Criar uma nova organização para este usuário, que será o administrador
      const organizationName = `${name}'s Organization`;
      
      const { data: org, error: orgError } = await supabaseClient
        .from('organizations')
        .insert({
          name: organizationName,
          owner_id: user_id
        })
        .select('id')
        .single();

      if (orgError) throw orgError;
      userOrganizationId = org.id;
    }

    // Sempre atribuir o papel de admin para novos usuários
    const userRole = 'admin';

    // Insert the new profile
    const { error } = await supabaseClient
      .from('profiles')
      .insert({
        id: user_id,
        name,
        role: userRole,
        organization_id: userOrganizationId
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        message: "Profile created successfully",
        organization_id: userOrganizationId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in create_profile function:", error)
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
