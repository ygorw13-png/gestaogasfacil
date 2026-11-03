// In-memory fictional backend for the G0.1 admin candidate tests (mocks only).
import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { AdminFailure, AdminRepository, canonicalRole, MSG, ProfileRow, Role } from '../candidate/supabase/functions/_shared/g01-admin-core.ts';

export const ORG_A = '00000000-0000-4000-8000-0000000000a1';
export const ORG_B = '00000000-0000-4000-8000-0000000000b1';
export const NEW_ORG = '00000000-0000-4000-8000-0000000000c1';
export const ADMIN = '00000000-0000-4000-8000-000000000001';
export const USER = '00000000-0000-4000-8000-000000000002';
export const OTHER = '00000000-0000-4000-8000-000000000003';
export const NEW = '00000000-0000-4000-8000-000000000009';

type Key = Exclude<keyof AdminRepository, 'createBannedSupported'>;
/** before = throws without effect; after = applies the effect then throws (lost response). n = call number. */
export type Fault = { when: 'before' | 'after'; n?: number };
export interface Opts { fail?: Partial<Record<Key, Fault>>; createBanned?: boolean; authReportsBanned?: boolean }

export function world(o: Opts = {}) {
  const profiles = new Map<string, ProfileRow>([
    [ADMIN, { id: ADMIN, organization_id: ORG_A, role: 'admin', ativo: true, name: 'Ana' }],
    [USER, { id: USER, organization_id: ORG_A, role: 'user', ativo: true, name: 'Beto' }],
    [OTHER, { id: OTHER, organization_id: ORG_B, role: 'user', ativo: true, name: 'Caio' }],
  ]);
  const roles = new Map<string, string[]>([[ADMIN, ['admin']], [USER, ['user']], [OTHER, ['user']]]);
  const banned = new Set<string>();
  const authUsers = new Set([ADMIN, USER, OTHER]);
  const orgs = new Map<string, string>([[ORG_A, ADMIN], [ORG_B, OTHER]]);
  const calls: Record<string, number> = {};
  const log: string[] = [];
  const run = async <T>(k: Key, effect: () => T): Promise<T> => {
    calls[k] = (calls[k] ?? 0) + 1; log.push(k);
    const fl = o.fail?.[k];
    const hit = fl && (fl.n === undefined || fl.n === calls[k]);
    if (hit && fl!.when === 'before') throw new Error('boom:' + k);
    const r = effect();
    if (hit) throw new Error('lost:' + k);
    return r;
  };
  const repo: AdminRepository = {
    createBannedSupported: o.createBanned ?? true,
    authenticate: (t) => run('authenticate', () => (t === 'admin' ? ADMIN : t === 'user' ? USER : t === 'other' ? OTHER : null)),
    getProfile: (id) => run('getProfile', () => { const p = profiles.get(id); return p ? { ...p } : null; }),
    getRoles: (id) => run('getRoles', () => [...(roles.get(id) ?? [])]),
    getBanned: (id) => run('getBanned', () => (authUsers.has(id) ? banned.has(id) : null)),
    createBannedAuthUser: ({ name }) => run('createBannedAuthUser', () => {
      authUsers.add(NEW);
      const reportsBanned = o.authReportsBanned ?? true;
      if (reportsBanned) banned.add(NEW);
      // Simulates the current signup trigger: new org + admin role, active.
      orgs.set(NEW_ORG, NEW);
      profiles.set(NEW, { id: NEW, organization_id: NEW_ORG, role: 'admin', ativo: true, name }); roles.set(NEW, ['admin']);
      return { id: NEW, banned: reportsBanned };
    }),
    deleteAuthUser: (id) => run('deleteAuthUser', () => { authUsers.delete(id); banned.delete(id); profiles.delete(id); roles.delete(id); }),
    setBan: (id, b) => run('setBan', () => { b ? banned.add(id) : banned.delete(id); }),
    updateProfile: (id, patch) => run('updateProfile', () => { const p = profiles.get(id); if (!p) return 0; Object.assign(p, patch); return 1; }),
    replaceRole: (id, r) => run('replaceRole', () => { roles.set(id, [r]); }),
    setRoleAsCaller: (id, r: Role) => run('setRoleAsCaller', () => { roles.set(id, [r]); profiles.get(id)!.role = r; }),
    resetPassword: () => run('resetPassword', () => {}),
  };
  const state = (id: string) => ({
    auth: authUsers.has(id), banned: banned.has(id),
    ativo: profiles.get(id)?.ativo ?? null, role: profiles.get(id)?.role ?? null, roles: roles.get(id) ?? [],
    org: profiles.get(id)?.organization_id ?? null,
    canonical: canonicalRole(profiles.get(id) ?? null, roles.get(id) ?? []),
  });
  return { repo, profiles, roles, banned, authUsers, orgs, log, state };
}

export const valid = { email: ' Novo@Exemplo.test ', password: 'segura123', name: 'Novo Teste', role: 'entregador' };

/** Asserts code AND the exact user-facing message (MSG table when the code is one of the incomplete codes). */
export async function code(p: Promise<unknown>, c: string, message?: string) {
  const e = (await assertRejects(() => p, AdminFailure)) as AdminFailure;
  assertEquals(e.code, c);
  const expected = message ?? (MSG as Record<string, string>)[c];
  if (expected) assertEquals(e.message, expected);
  for (const banned of [/foi removid/i, /nada foi mantido/i, /continua bloquead/i, /ficou bloquead/i, /acesso bloqueado/i]) {
    assertEquals(banned.test(e.message), false, `mensagem afirma estado não comprovado: ${e.message}`);
  }
  return e;
}
