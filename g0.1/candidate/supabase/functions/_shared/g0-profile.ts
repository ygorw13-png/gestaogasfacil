import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { Failure, makeProfileHandler } from './g0-profile-core.ts';

export function profileHandler(mode: 'read'|'recover') {
  return makeProfileHandler(mode, (token) => {
    const url=Deno.env.get('SUPABASE_URL');
    const key=Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key) throw new Failure(503,'SERVICE_UNAVAILABLE');
    const client=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
    return {
      async authenticate(value) {
        const {data,error}=await client.auth.getUser(value);
        if (error) return null;
        return data.user?.id ?? null;
      },
      async verify() {
        const {error}=await client.rpc('g0_recover_own_profile');
        if (!error) return;
        if (error.message==='PROFILE_REPAIR_REQUIRED') throw new Failure(409,'PROFILE_REPAIR_REQUIRED');
        if (error.code==='42501') throw new Failure(403,'PROFILE_NOT_VERIFIED');
        throw new Failure(503,'PROFILE_UNAVAILABLE');
      },
      async readSelf(id) {
        const {data:p,error}=await client.from('profiles').select('id,name,organization_id,role,ativo').eq('id',id).maybeSingle();
        if (error) throw new Failure(503,'PROFILE_UNAVAILABLE');
        if (!p) throw new Failure(404,'PROFILE_NOT_FOUND');
        if (p.id!==id || p.ativo!==true || !p.organization_id) throw new Failure(403,'PROFILE_NOT_VERIFIED');
        const {data:roles,error:re}=await client.from('user_roles').select('role').eq('user_id',id);
        if (re) throw new Failure(503,'ROLE_UNAVAILABLE');
        const role=roles?.length===1 ? roles[0].role : null;
        if (!role || !['admin','user','entregador'].includes(role)) throw new Failure(403,'ROLE_NOT_VERIFIED');
        if (role!==p.role) throw new Failure(403,'ROLE_MISMATCH');
        const {data:org,error:oe}=await client.from('organizations').select('id,name,owner_id').eq('id',p.organization_id).maybeSingle();
        if (oe) throw new Failure(503,'ORGANIZATION_UNAVAILABLE');
        if (!org || org.id!==p.organization_id) throw new Failure(403,'ORGANIZATION_NOT_VERIFIED');
        return {...p,role,roles:[role],organizations:org};
      },
    };
  }, {...corsHeaders,'Access-Control-Allow-Methods':'POST, OPTIONS'});
}