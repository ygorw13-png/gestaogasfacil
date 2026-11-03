// Deno tests for the new G0.1 admin candidate. Fictional in-memory fixtures only.
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { AdminFailure, AdminRepository, createUser, makeAdminHandler, manageUser, ProfileRow, Role } from '../candidate/supabase/functions/_shared/g01-admin-core.ts';

const ORG_A = '00000000-0000-4000-8000-0000000000a1';
const ORG_B = '00000000-0000-4000-8000-0000000000b1';
const ADMIN = '00000000-0000-4000-8000-000000000001';
const USER = '00000000-0000-4000-8000-000000000002';
const OTHER = '00000000-0000-4000-8000-000000000003';
const NEW = '00000000-0000-4000-8000-000000000009';

type Fail = Partial<Record<keyof AdminRepository, boolean>>;
function world(fail: Fail = {}) {
  const profiles = new Map<string, ProfileRow>([
    [ADMIN, { id: ADMIN, organization_id: ORG_A, role: 'admin', ativo: true, name: 'Ana' }],
    [USER, { id: USER, organization_id: ORG_A, role: 'user', ativo: true, name: 'Beto' }],
    [OTHER, { id: OTHER, organization_id: ORG_B, role: 'user', ativo: true, name: 'Caio' }],
  ]);
  const roles = new Map<string, string[]>([[ADMIN, ['admin']], [USER, ['user']], [OTHER, ['user']]]);
  const banned = new Set<string>();
  const authUsers = new Set([ADMIN, USER, OTHER]);
  const orgs = new Map<string, string>([[ORG_A, ADMIN], [ORG_B, OTHER]]);
  const log: string[] = [];
  const f = (k: keyof AdminRepository) => { log.push(k); if (fail[k]) throw new Error('boom:' + k); };
  const repo: AdminRepository = {
    async authenticate(t) { f('authenticate'); return t === 'admin' ? ADMIN : t === 'user' ? USER : t === 'other' ? OTHER : null; },
    async getProfile(id) { f('getProfile'); const p = profiles.get(id); return p ? { ...p } : null; },
    async getRoles(id) { f('getRoles'); return [...(roles.get(id) ?? [])]; },
    async createAuthUser({ name }) {
      f('createAuthUser'); authUsers.add(NEW);
      const org = '00000000-0000-4000-8000-0000000000c1'; orgs.set(org, NEW);
      profiles.set(NEW, { id: NEW, organization_id: org, role: 'admin', ativo: true, name }); roles.set(NEW, ['admin']);
      return NEW;
    },
    async deleteAuthUser(id) { f('deleteAuthUser'); authUsers.delete(id); profiles.delete(id); roles.delete(id); },
    async setBan(id, b) { f('setBan'); b ? banned.add(id) : banned.delete(id); },
    async updateProfile(id, patch) { f('updateProfile'); const p = profiles.get(id); if (!p) return 0; Object.assign(p, patch); return 1; },
    async replaceRole(id, r) { f('replaceRole'); roles.set(id, [r]); },
    async setRoleAsCaller(id, r: Role) { f('setRoleAsCaller'); roles.set(id, [r]); profiles.get(id)!.role = r; },
    async deleteOrphanOrganization(owner, keep) { f('deleteOrphanOrganization'); for (const [o, w] of orgs) if (w === owner && o !== keep) orgs.delete(o); },
    async resetPassword() { f('resetPassword'); },
  };
  return { repo, profiles, roles, banned, authUsers, orgs, log };
}
const valid = { email: ' Novo@Exemplo.test ', password: 'segura123', name: 'Novo Teste', role: 'entregador' };
const code = async (p: Promise<unknown>, c: string) => {
  const e = await assertRejects(() => p, AdminFailure); assertEquals((e as AdminFailure).code, c);
};

// --- caller verification
Deno.test('01 token desconhecido -> AUTH_REQUIRED', async () => { const w = world(); await code(createUser(w.repo, 'x', valid), 'AUTH_REQUIRED'); });
Deno.test('02 usuário comum não administra', async () => { const w = world(); await code(createUser(w.repo, 'user', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('03 admin inativo bloqueado', async () => { const w = world(); w.profiles.get(ADMIN)!.ativo = false; await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('04 admin com ativo nulo bloqueado', async () => { const w = world(); w.profiles.get(ADMIN)!.ativo = null; await code(manageUser(w.repo, 'admin', { action: 'delete', target_user_id: USER }), 'ADMIN_NOT_VERIFIED'); });
Deno.test('05 admin sem empresa bloqueado', async () => { const w = world(); w.profiles.get(ADMIN)!.organization_id = null; await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('06 papel do perfil diverge de user_roles', async () => { const w = world(); w.profiles.get(ADMIN)!.role = 'user'; await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('07 dois papéis em user_roles bloqueado', async () => { const w = world(); w.roles.set(ADMIN, ['admin', 'user']); await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('08 perfil ausente bloqueado (sem recriação)', async () => { const w = world(); w.profiles.delete(ADMIN); await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); assertEquals(w.profiles.has(ADMIN), false); });

// --- strict validation
Deno.test('09 campo extra rejeitado (organization_id)', async () => { const w = world(); await code(createUser(w.repo, 'admin', { ...valid, organization_id: ORG_B }), 'FIELD_NOT_ALLOWED'); assertEquals(w.log.includes('createAuthUser'), false); });
Deno.test('10 papel fora dos três rejeitado', async () => { const w = world(); await code(createUser(w.repo, 'admin', { ...valid, role: 'gerente' }), 'INVALID_ROLE'); });
Deno.test('11 e-mail inválido', async () => { const w = world(); await code(createUser(w.repo, 'admin', { ...valid, email: 'semarroba' }), 'INVALID_FIELD'); });
Deno.test('12 senha curta e longa', async () => {
  const w = world();
  await code(createUser(w.repo, 'admin', { ...valid, password: '1234567' }), 'INVALID_FIELD');
  await code(createUser(w.repo, 'admin', { ...valid, password: 'x'.repeat(73) }), 'INVALID_FIELD');
});
Deno.test('13 nome com tipo errado', async () => { const w = world(); await code(createUser(w.repo, 'admin', { ...valid, name: 5 }), 'INVALID_FIELD'); });
Deno.test('14 corpo array rejeitado', async () => { const w = world(); await code(createUser(w.repo, 'admin', []), 'INVALID_BODY'); });
Deno.test('15 target_user_id não-UUID', async () => { const w = world(); await code(manageUser(w.repo, 'admin', { action: 'delete', target_user_id: 'abc' }), 'INVALID_FIELD'); });
Deno.test('16 ação desconhecida', async () => { const w = world(); await code(manageUser(w.repo, 'admin', { action: 'promote_all', target_user_id: USER }), 'INVALID_ACTION'); });
Deno.test('17 campo de outra ação rejeitado', async () => { const w = world(); await code(manageUser(w.repo, 'admin', { action: 'delete', target_user_id: USER, role: 'admin' }), 'FIELD_NOT_ALLOWED'); assertEquals(w.authUsers.has(USER), true); });
Deno.test('18 active não-booleano', async () => { const w = world(); await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: 'false' }), 'INVALID_FIELD'); });

// --- creation
Deno.test('19 criação completa na empresa do admin', async () => {
  const w = world();
  const r = await createUser(w.repo, 'admin', valid);
  assertEquals(r, { user: { id: NEW, name: 'Novo Teste', role: 'entregador' } });
  const p = w.profiles.get(NEW)!;
  assertEquals([p.organization_id, p.role, p.ativo], [ORG_A, 'entregador', true]);
  assertEquals(w.roles.get(NEW), ['entregador']);
  assertEquals(w.banned.has(NEW), false);
  assertEquals([...w.orgs.values()].includes(NEW), false);
  assertEquals(w.log.filter((x) => x === 'setBan').length, 2);
});
for (const step of ['updateProfile', 'replaceRole', 'deleteOrphanOrganization', 'setBan'] as const) {
  Deno.test(`20 falha em ${step} -> sem sucesso e conta removida`, async () => {
    const w = world({ [step]: true });
    await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_FAILED');
    assertEquals(w.authUsers.has(NEW), false);
  });
}
Deno.test('21 falha + remoção falha -> INCOMPLETE e conta bloqueada', async () => {
  const w = world({ replaceRole: true, deleteAuthUser: true });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
  assertEquals(w.banned.has(NEW), true);
});
Deno.test('22 verificação pós-gravação divergente aborta', async () => {
  const w = world();
  w.repo.replaceRole = async (id) => { w.roles.set(id, ['user']); }; // gravou papel errado
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_FAILED');
});
Deno.test('23 e-mail duplicado -> 409', async () => {
  const w = world(); w.repo.createAuthUser = async () => { throw new Error('User already registered'); };
  await code(createUser(w.repo, 'admin', valid), 'EMAIL_IN_USE');
});

// --- manage: scope & self
Deno.test('24 alvo de outra empresa -> 404 sem gravação', async () => {
  const w = world();
  for (const b of [{ action: 'delete' }, { action: 'toggle_active', active: false }, { action: 'set_role', role: 'admin' }, { action: 'reset_password', new_password: 'novasenha1' }, { action: 'update_profile', name: 'X Y' }]) {
    await code(manageUser(w.repo, 'admin', { ...b, target_user_id: OTHER }), 'TARGET_NOT_FOUND');
  }
  assertEquals(w.authUsers.has(OTHER), true); assertEquals(w.banned.size, 0); assertEquals(w.roles.get(OTHER), ['user']);
});
Deno.test('25 alvo inexistente -> mesma resposta 404', async () => { const w = world(); await code(manageUser(w.repo, 'admin', { action: 'delete', target_user_id: NEW }), 'TARGET_NOT_FOUND'); });
Deno.test('26 autoalteração bloqueada em todas as ações', async () => {
  const w = world();
  for (const b of [{ action: 'delete' }, { action: 'toggle_active', active: false }, { action: 'set_role', role: 'user' }, { action: 'reset_password', new_password: 'novasenha1' }, { action: 'update_profile', name: 'Ana B' }]) {
    await code(manageUser(w.repo, 'admin', { ...b, target_user_id: ADMIN.toUpperCase() }), 'SELF_CHANGE_FORBIDDEN');
  }
  assertEquals(w.profiles.get(ADMIN)!.role, 'admin');
});

// --- manage: actions
Deno.test('27 desativação: bloqueia login antes do perfil', async () => {
  const w = world();
  assertEquals(await manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false }), { ok: true });
  assertEquals(w.banned.has(USER), true); assertEquals(w.profiles.get(USER)!.ativo, false);
  const i = w.log.lastIndexOf('setBan'), j = w.log.lastIndexOf('updateProfile'); assertEquals(i < j, true);
});
Deno.test('28 desativação com falha no perfil -> erro, continua bloqueado', async () => {
  const w = world({ updateProfile: true });
  await assertRejects(() => manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false }));
  assertEquals(w.banned.has(USER), true);
});
Deno.test('29 reativação autorizada', async () => {
  const w = world(); w.profiles.get(USER)!.ativo = false; w.banned.add(USER);
  await manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true });
  assertEquals(w.profiles.get(USER)!.ativo, true); assertEquals(w.banned.has(USER), false);
});
Deno.test('30 reativação com papel inconsistente recusada', async () => {
  const w = world(); w.profiles.get(USER)!.ativo = false; w.banned.add(USER); w.roles.set(USER, []);
  await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true }), 'ROLE_NOT_VERIFIED');
  assertEquals(w.banned.has(USER), true); assertEquals(w.profiles.get(USER)!.ativo, false);
});
Deno.test('31 reativação: falha ao desbanir desfaz ativo', async () => {
  const w = world({ setBan: true }); w.profiles.get(USER)!.ativo = false; w.banned.add(USER);
  await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true }), 'REACTIVATION_FAILED');
  assertEquals(w.profiles.get(USER)!.ativo, false); assertEquals(w.banned.has(USER), true);
});
Deno.test('32 troca de papel via RPC do próprio admin + verificação', async () => {
  const w = world();
  await manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' });
  assertEquals(w.roles.get(USER), ['entregador']); assertEquals(w.profiles.get(USER)!.role, 'entregador');
  assertEquals(w.log.includes('replaceRole'), false);
});
Deno.test('33 troca de papel não confirmada -> erro', async () => {
  const w = world(); w.repo.setRoleAsCaller = async () => {};
  await code(manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' }), 'ROLE_CHANGE_NOT_VERIFIED');
});
Deno.test('34 edição comum altera só o nome', async () => {
  const w = world();
  await manageUser(w.repo, 'admin', { action: 'update_profile', target_user_id: USER, name: '  Beto Silva ' });
  const p = w.profiles.get(USER)!; assertEquals([p.name, p.role, p.ativo, p.organization_id], ['Beto Silva', 'user', true, ORG_A]);
});
Deno.test('35 redefinição de senha e exclusão', async () => {
  const w = world();
  await manageUser(w.repo, 'admin', { action: 'reset_password', target_user_id: USER, new_password: 'novasenha1' });
  await manageUser(w.repo, 'admin', { action: 'delete', target_user_id: USER });
  assertEquals(w.authUsers.has(USER), false);
});

// --- HTTP handler
const H = (op: typeof createUser, w: ReturnType<typeof world>) => makeAdminHandler(op, () => w.repo, { 'Access-Control-Allow-Origin': '*' });
Deno.test('36 handler: sem Bearer -> 401; GET -> 405; JSON inválido -> 400', async () => {
  const w = world(), h = H(createUser, w);
  assertEquals((await h(new Request('http://x', { method: 'POST', body: '{}' }))).status, 401);
  assertEquals((await h(new Request('http://x', { method: 'GET' }))).status, 405);
  assertEquals((await h(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer admin' }, body: '{' }))).status, 400);
});
Deno.test('37 handler: erro inesperado -> 503 sem detalhes internos', async () => {
  const w = world({ getProfile: true }), h = H(createUser, w);
  const r = await h(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer admin' }, body: JSON.stringify(valid) }));
  assertEquals(r.status, 503); const b = await r.json(); assertEquals(b.code, 'SERVICE_UNAVAILABLE'); assertEquals(JSON.stringify(b).includes('boom'), false);
});
Deno.test('38 handler: sucesso mantém formato usado pela tela', async () => {
  const w = world(), h = H(createUser, w);
  const r = await h(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer admin' }, body: JSON.stringify(valid) }));
  assertEquals(r.status, 200); assertEquals((await r.json()).user.role, 'entregador'); assertEquals(r.headers.get('Cache-Control'), 'no-store');
});
