// Failure-scenario tests for the new G0.1 admin candidate (mocks only, fictional data).
// These are additional to the 41 tests in admin.test.ts. They assert the EFFECTIVE state
// (Auth user exists?, banned?, profile.ativo, profile.role, user_roles) after each failure.
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { AdminFailure, AdminRepository, canonicalRole, createUser, manageUser, ProfileRow } from '../candidate/supabase/functions/_shared/g01-admin-core.ts';

const ORG_A = '00000000-0000-4000-8000-0000000000a1';
const ADMIN = '00000000-0000-4000-8000-000000000001';
const USER = '00000000-0000-4000-8000-000000000002';
const NEW = '00000000-0000-4000-8000-000000000009';
const NEW_ORG = '00000000-0000-4000-8000-0000000000c1';

// fail: method -> which call number (1-based) should throw; true = every call.
type Fail = Partial<Record<keyof AdminRepository, true | number>>;
function world(fail: Fail = {}) {
  const profiles = new Map<string, ProfileRow>([
    [ADMIN, { id: ADMIN, organization_id: ORG_A, role: 'admin', ativo: true, name: 'Ana' }],
    [USER, { id: USER, organization_id: ORG_A, role: 'user', ativo: true, name: 'Beto' }],
  ]);
  const roles = new Map<string, string[]>([[ADMIN, ['admin']], [USER, ['user']]]);
  const banned = new Set<string>();
  const authUsers = new Set([ADMIN, USER]);
  const orgs = new Map<string, string>([[ORG_A, ADMIN]]);
  const calls: Record<string, number> = {};
  const log: string[] = [];
  const f = (k: keyof AdminRepository) => {
    calls[k] = (calls[k] ?? 0) + 1; log.push(k);
    const v = fail[k]; if (v === true || v === calls[k]) throw new Error('boom:' + k);
  };
  const repo: AdminRepository = {
    async authenticate(t) { f('authenticate'); return t === 'admin' ? ADMIN : null; },
    async getProfile(id) { f('getProfile'); const p = profiles.get(id); return p ? { ...p } : null; },
    async getRoles(id) { f('getRoles'); return [...(roles.get(id) ?? [])]; },
    async createAuthUser({ name }) {
      f('createAuthUser'); authUsers.add(NEW); orgs.set(NEW_ORG, NEW);
      // Simulates the current signup trigger: new org + admin role, active.
      profiles.set(NEW, { id: NEW, organization_id: NEW_ORG, role: 'admin', ativo: true, name }); roles.set(NEW, ['admin']);
      return NEW;
    },
    async deleteAuthUser(id) { f('deleteAuthUser'); authUsers.delete(id); profiles.delete(id); roles.delete(id); },
    async setBan(id, b) { f('setBan'); b ? banned.add(id) : banned.delete(id); },
    async updateProfile(id, patch) { f('updateProfile'); const p = profiles.get(id); if (!p) return 0; Object.assign(p, patch); return 1; },
    async replaceRole(id, r) { f('replaceRole'); roles.set(id, [r]); },
    async setRoleAsCaller(id, r) { f('setRoleAsCaller'); roles.set(id, [r]); profiles.get(id)!.role = r; },
    async deleteOrphanOrganization(o, keep) { f('deleteOrphanOrganization'); for (const [k, w] of orgs) if (w === o && k !== keep) orgs.delete(k); },
    async resetPassword() { f('resetPassword'); },
  };
  const state = (id: string) => ({
    auth: authUsers.has(id), banned: banned.has(id),
    ativo: profiles.get(id)?.ativo ?? null, role: profiles.get(id)?.role ?? null, roles: roles.get(id) ?? [],
    canonical: canonicalRole(profiles.get(id) ?? null, roles.get(id) ?? []),
  });
  return { repo, profiles, roles, banned, authUsers, orgs, log, state };
}
const valid = { email: 'novo@exemplo.test', password: 'segura123', name: 'Novo Teste', role: 'entregador' };
const code = async (p: Promise<unknown>, c: string) => {
  const e = await assertRejects(() => p, AdminFailure); assertEquals((e as AdminFailure).code, c);
};

// ---------- F1: creation interrupted at every step ----------
Deno.test('F01 createAuthUser falha -> nada criado, erro 503 genérico', async () => {
  const w = world({ createAuthUser: true });
  await assertRejects(() => createUser(w.repo, 'admin', valid));
  assertEquals(w.authUsers.has(NEW), false);
});
const steps: [keyof AdminRepository, number][] = [
  ['setBan', 1], ['updateProfile', 1], ['replaceRole', 1], ['getProfile', 2], ['getRoles', 2], ['deleteOrphanOrganization', 1], ['setBan', 2],
];
for (const [step, n] of steps) {
  Deno.test(`F02 falha em ${step}#${n}, exclusão OK -> conta removida`, async () => {
    const w = world({ [step]: n });
    await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_FAILED');
    assertEquals(w.state(NEW).auth, false);
  });
  Deno.test(`F03 falha em ${step}#${n} + exclusão falha -> INCOMPLETE; estado efetivo`, async () => {
    const w = world({ [step]: n, deleteAuthUser: true });
    await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
    const s = w.state(NEW);
    assertEquals(s.auth, true);
    if (step === 'setBan' && n === 1) {
      // Ban never applied: the account is NOT blocked in Auth. Only the trigger-created org/admin row exists.
      assertEquals(s.banned, false);
      assertEquals([s.role, s.roles, w.profiles.get(NEW)!.organization_id], ['admin', ['admin'], NEW_ORG]);
    } else if (step === 'setBan' && n === 2) {
      // Fully provisioned but unban failed: still banned, profile canonical in caller org.
      assertEquals(s.banned, true); assertEquals(s.canonical, 'entregador');
    } else {
      assertEquals(s.banned, true);
    }
  });
}

// ---------- F2: deactivation ----------
Deno.test('F04 desativação: setBan falha -> nada alterado (perfil ativo, sem ban)', async () => {
  const w = world({ setBan: true });
  await assertRejects(() => manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false }));
  assertEquals([w.state(USER).banned, w.state(USER).ativo], [false, true]);
});
Deno.test('F05 desativação: perfil falha -> ban aplicado, perfil ainda ativo', async () => {
  const w = world({ updateProfile: true });
  await assertRejects(() => manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false }));
  const s = w.state(USER); assertEquals([s.banned, s.ativo, s.canonical], [true, true, 'user']);
});
Deno.test('F06 desativação: perfil retorna 0 linhas -> DEACTIVATION_INCOMPLETE, ban mantido', async () => {
  const w = world(); w.repo.updateProfile = async () => 0;
  await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false }), 'DEACTIVATION_INCOMPLETE');
  assertEquals(w.state(USER).banned, true);
});

// ---------- F3: reactivation ----------
const inactive = (fail: Fail) => { const w = world(fail); w.profiles.get(USER)!.ativo = false; w.banned.add(USER); return w; };
Deno.test('F07 reativação: perfil falha -> continua inativo e banido', async () => {
  const w = inactive({ updateProfile: true });
  await assertRejects(() => manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true }));
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [false, true]);
});
Deno.test('F08 reativação: desbanir falha, reversão OK -> inativo e banido', async () => {
  const w = inactive({ setBan: true });
  await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true }), 'REACTIVATION_FAILED');
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [false, true]);
});
Deno.test('F09 reativação: desbanir falha E reversão falha -> perfil ativo, mas banido', async () => {
  const w = inactive({ setBan: true, updateProfile: 2 });
  await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true }), 'REACTIVATION_FAILED');
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [true, true]);
});

// ---------- F4: role change concurrent with deactivation ----------
Deno.test('F10 set_role e desativação intercalados -> fim: inativo + banido + papel novo coerente', async () => {
  const w = world();
  // Deactivation's ban/profile write lands between set_role's RPC and its verification read.
  const rpc = w.repo.setRoleAsCaller.bind(w.repo);
  w.repo.setRoleAsCaller = async (id, r) => {
    await rpc(id, r);
    await manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false });
  };
  const res = await manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' });
  assertEquals(res, { ok: true }); // verification ignores ativo by design
  const s = w.state(USER);
  assertEquals([s.banned, s.ativo, s.role, s.roles, s.canonical], [true, false, 'entregador', ['entregador'], null]);
});
Deno.test('F11 reativação lê papel e set_role muda antes do update -> ainda coerente (RPC atômica)', async () => {
  const w = inactive({});
  const gr = w.repo.getRoles.bind(w.repo);
  let once = false;
  w.repo.getRoles = async (id) => {
    const r = await gr(id);
    if (!once && id === USER) { once = true; w.roles.set(USER, ['entregador']); w.profiles.get(USER)!.role = 'entregador'; }
    return r;
  };
  await manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true });
  assertEquals(w.state(USER).canonical, 'entregador');
});
