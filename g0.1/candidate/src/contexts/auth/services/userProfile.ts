import { supabase } from '@/integrations/supabase/client';
import type { ExistingRole } from './permissions';
export type VerifiedProfile = {
  id: string; name: string; ativo: true; role: ExistingRole; roles: ExistingRole[];
  organization_id: string; organizations: {id:string; name:string; owner_id:string};
};
export class ProfileError extends Error {
  constructor(public code: string) {
    super(code==='PROFILE_NOT_FOUND' || code==='PROFILE_REPAIR_REQUIRED'
      ? 'Seu cadastro precisa de revisão administrativa.'
      : 'Não foi possível verificar seu acesso. Tente novamente.');
  }
}
export async function fetchUserProfile(userId: string): Promise<VerifiedProfile> {
  const {data,error}=await supabase.functions.invoke('get_user_profile',{body:{user_id:userId}});
  if (error) {
    let code='PROFILE_UNAVAILABLE';
    if ('context' in error && error.context instanceof Response) {
      try { const body=await error.context.json(); code=body.code ?? code; } catch { /* controlled failure */ }
    }
    throw new ProfileError(code);
  }
  if (!data || data.code || data.id!==userId || data.ativo!==true || !data.organizations
    || data.organizations.id!==data.organization_id || !Array.isArray(data.roles)
    || data.roles.length!==1 || data.roles[0]!==data.role
    || !['admin','user','entregador'].includes(data.role)) throw new ProfileError(data?.code ?? 'PROFILE_NOT_VERIFIED');
  return data;
}
export async function recoverOwnProfile(userId: string) {
  const {data,error}=await supabase.functions.invoke('create_profile',{body:{user_id:userId}});
  if (error || data?.code) throw new ProfileError(data?.code ?? 'PROFILE_REPAIR_REQUIRED');
  return fetchUserProfile(userId);
}