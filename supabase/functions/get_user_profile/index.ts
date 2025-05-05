
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

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      )
    }

    // Buscar o perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.log(`Error fetching profile for user ${user_id}:`, profileError)
      
      // Verificar se o usuário existe na auth.users
      const { data: authUser, error: authUserError } = await supabaseClient.auth.admin.getUserById(user_id)
      
      if (authUserError || !authUser.user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        )
      }
      
      // Se o usuário existe, mas não tem perfil, vamos criar um perfil padrão para ele
      // e uma organização padrão
      const userName = authUser.user.user_metadata?.name || 'Novo Usuário'
      
      // Criar uma organização para este usuário
      const { data: org, error: orgError } = await supabaseClient
        .from('organizations')
        .insert({
          name: `${userName}'s Organization`,
          owner_id: user_id
        })
        .select('id')
        .single()
        
      if (orgError) {
        console.error("Error creating organization:", orgError)
        throw orgError
      }
      
      // Criar o perfil do usuário
      const { data: newProfile, error: newProfileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user_id,
          name: userName,
          role: 'admin',
          organization_id: org.id
        })
        .select('*, organizations(*)')
        .single()
        
      if (newProfileError) {
        console.error("Error creating profile:", newProfileError)
        throw newProfileError
      }
      
      return new Response(
        JSON.stringify(newProfile),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify(profile),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in get_user_profile function:", error)
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
