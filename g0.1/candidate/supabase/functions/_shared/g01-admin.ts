// G0.1 RELEASE CANDIDATE — backend adapter for g01-admin-core. Not deployed.
import { createClient } from 'npm:@supabase/supabase-js@2.106.2';
import { AdminRepository, Role } from './g01-admin-core.ts';

const BAN_FOREVER = '876000h';

// deno-lint-ignore no-explicit-any
function must(r: { data: any; error: unknown }): any {
  if (r.error) throw r.error;
  return r.data;
}

export function makeRepository(token: string): AdminRepository {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) throw new Error('CONFIG_MISSING');
  const asCaller = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    async authenticate(t) {
      const { data, error } = await admin.auth.getUser(t);
      return error || !data.user ? null : data.user.id;
    },
    async getProfile(id) {
      return must(await admin.from('profiles').select('id, organization_id, role, ativo, name').eq('id', id).maybeSingle());
    },
    async getRoles(id) {
      const rows = must(await admin.from('user_roles').select('role').eq('user_id', id)) ?? [];
      return rows.map((r: { role: string }) => r.role);
    },
    async createAuthUser({ email, password, name }) {
      const data = must(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } }));
      if (!data.user) throw new Error('CREATE_FAILED');
      return data.user.id;
    },
    async deleteAuthUser(id) { must(await admin.auth.admin.deleteUser(id)); },
    async setBan(id, banned) { must(await admin.auth.admin.updateUserById(id, { ban_duration: banned ? BAN_FOREVER : 'none' })); },
    async updateProfile(id, patch) {
      const rows = must(await admin.from('profiles').update(patch).eq('id', id).select('id')) ?? [];
      return rows.length;
    },
    async replaceRole(id, role: Role) {
      must(await admin.from('user_roles').delete().eq('user_id', id));
      must(await admin.from('user_roles').insert({ user_id: id, role }));
    },
    async setRoleAsCaller(id, role) {
      must(await asCaller.rpc('set_user_role', { _user_id: id, _role: role }));
    },
    async deleteOrphanOrganization(ownerId, keepOrgId) {
      // Removes only the organization the signup trigger just created for this brand-new account.
      must(await admin.from('organizations').delete().eq('owner_id', ownerId).neq('id', keepOrgId));
    },
    async resetPassword(id, password) { must(await admin.auth.admin.updateUserById(id, { password })); },
  };
}
