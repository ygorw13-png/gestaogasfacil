// G0.1 admin candidate, revision 2 — failure scenarios (mocks, fictional data).
// SAFE-*: required safe outcome (must hold for release). DIAG-*: diagnostics that only DOCUMENT the
// residual effective state after an incomplete operation; they are not safety guarantees.
import { assertEquals } from 'jsr:@std/assert@1';
import { createUser, manageUser } from '../candidate/supabase/functions/_shared/g01-admin-core.ts';
import { code, Fault, NEW, NEW_ORG, ORG_A, USER, valid, world } from './admin-world.ts';

type W = ReturnType<typeof world>;
const before: Fault = { when: 'before' }, after: Fault = { when: 'after' };

// ---------- Creation ----------
Deno.test('SAFE-C01 createBannedAuthUser falha antes -> INCOMPLETE (resultado incerto), nenhuma exclusão tentada', async () => {
  const w = world({ fail: { createBannedAuthUser: before } });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
  assertEquals(w.log.includes('deleteAuthUser'), false);
});
Deno.test('SAFE-C02 resposta perdida na criação -> INCOMPLETE; a conta criada está banida', async () => {
  const w = world({ fail: { createBannedAuthUser: after } });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
  assertEquals([w.state(NEW).auth, w.state(NEW).banned], [true, true]);
});
Deno.test('SAFE-C03 Auth não confirma bloqueio na criação -> INCOMPLETE, nenhuma gravação de perfil/papel', async () => {
  const w = world({ authReportsBanned: false });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
  assertEquals(w.log.includes('updateProfile') || w.log.includes('replaceRole') || w.log.includes('setBan'), false);
});
// Every post-creation step, before and after effect: account must still be banned (never unbanned early).
const createSteps: [Parameters<typeof world>[0] & object, string][] = [
  [{ fail: { getBanned: { when: 'before', n: 1 } } }, 'getBanned#1'],
  [{ fail: { updateProfile: before } }, 'updateProfile antes'],
  [{ fail: { updateProfile: after } }, 'updateProfile depois'],
  [{ fail: { replaceRole: before } }, 'replaceRole antes'],
  [{ fail: { replaceRole: after } }, 'replaceRole depois'],
  [{ fail: { getProfile: { when: 'before', n: 2 } } }, 'verificação'],
  [{ fail: { setBan: before } }, 'desbloqueio antes'],
];
for (const [opts, label] of createSteps) {
  Deno.test(`SAFE-C04 falha em ${label} -> INCOMPLETE; conta continua banida; sem exclusão nem limpeza de empresa`, async () => {
    const w = world(opts);
    await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
    assertEquals([w.state(NEW).auth, w.state(NEW).banned], [true, true]);
    assertEquals(w.log.includes('deleteAuthUser'), false);
    assertEquals(w.orgs.has(NEW_ORG), true);
  });
}
Deno.test('SAFE-C05 desbloqueio com resposta perdida -> INCOMPLETE (não sucesso), mesmo que o efeito tenha ocorrido', async () => {
  const w = world({ fail: { setBan: after } });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
});
Deno.test('DIAG-C06 desbloqueio com resposta perdida: estado efetivo = completo e desbloqueado', async () => {
  const w = world({ fail: { setBan: after } });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
  const s = w.state(NEW); assertEquals([s.banned, s.canonical, s.org], [false, 'entregador', ORG_A]);
});
Deno.test('DIAG-C07 falha em updateProfile: perfil do trigger = admin da empresa nova (banido)', async () => {
  const w = world({ fail: { updateProfile: before } });
  await code(createUser(w.repo, 'admin', valid), 'PROVISIONING_INCOMPLETE');
  const s = w.state(NEW); assertEquals([s.role, s.org, s.ativo, s.banned], ['admin', NEW_ORG, true, true]);
});

// ---------- Deactivation ----------
const deact = (w: W) => manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false });
for (const [f, label] of [
  [{ updateProfile: before }, 'perfil antes'], [{ updateProfile: after }, 'perfil depois (resposta perdida)'],
  [{ setBan: before }, 'ban antes'], [{ setBan: after }, 'ban depois (resposta perdida)'],
  [{ getBanned: before }, 'leitura de confirmação'],
] as [Record<string, Fault>, string][]) {
  Deno.test(`SAFE-D01 desativação falha em ${label} -> DEACTIVATION_INCOMPLETE`, async () => {
    const w = world({ fail: f });
    await code(deact(w), 'DEACTIVATION_INCOMPLETE');
  });
}
Deno.test('SAFE-D02 perfil falha antes -> ban não é tentado; nada indica sucesso', async () => {
  const w = world({ fail: { updateProfile: before } });
  await code(deact(w), 'DEACTIVATION_INCOMPLETE');
  assertEquals(w.log.includes('setBan'), false);
});
Deno.test('DIAG-D03 ban falha antes: perfil inativo, novo login ainda possível', async () => {
  const w = world({ fail: { setBan: before } });
  await code(deact(w), 'DEACTIVATION_INCOMPLETE');
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [false, false]);
});
Deno.test('DIAG-D04 ban com resposta perdida: estado efetivo inativo + banido, porém reportado incompleto', async () => {
  const w = world({ fail: { setBan: after } });
  await code(deact(w), 'DEACTIVATION_INCOMPLETE');
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [false, true]);
});

// ---------- Reactivation ----------
const inactive = (fail: Record<string, Fault> = {}) => { const w = world({ fail }); w.profiles.get(USER)!.ativo = false; w.banned.add(USER); return w; };
const react = (w: W) => manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true });
for (const [f, label] of [
  [{ updateProfile: before }, 'perfil antes'], [{ updateProfile: after }, 'perfil depois'],
  [{ getProfile: { when: 'before', n: 3 } }, 'leitura do perfil'], [{ setBan: before }, 'desbloqueio antes'],
  [{ setBan: after }, 'desbloqueio depois'], [{ getBanned: before }, 'leitura do ban'],
] as [Record<string, Fault>, string][]) {
  Deno.test(`SAFE-R01 reativação falha em ${label} -> REACTIVATION_INCOMPLETE`, async () => {
    await code(react(inactive(f)), 'REACTIVATION_INCOMPLETE');
  });
}
Deno.test('SAFE-R02 falha no perfil -> desbloqueio nunca tentado; login segue banido', async () => {
  for (const f of [before, after]) {
    const w = inactive({ updateProfile: f });
    await code(react(w), 'REACTIVATION_INCOMPLETE');
    assertEquals([w.log.includes('setBan'), w.state(USER).banned], [false, true]);
  }
});
Deno.test('DIAG-R03 desbloqueio falha antes: perfil ativo, login banido (inconsistente, exige conferência)', async () => {
  const w = inactive({ setBan: before });
  await code(react(w), 'REACTIVATION_INCOMPLETE');
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [true, true]);
});

// ---------- Other writes: lost responses ----------
Deno.test('SAFE-O01 set_role/update/reset/delete com resposta perdida -> erro INCOMPLETE específico', async () => {
  await code(manageUser(world({ fail: { setRoleAsCaller: after } }).repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' }), 'ROLE_CHANGE_INCOMPLETE');
  await code(manageUser(world({ fail: { updateProfile: after } }).repo, 'admin', { action: 'update_profile', target_user_id: USER, name: 'Beto S' }), 'UPDATE_INCOMPLETE');
  await code(manageUser(world({ fail: { resetPassword: after } }).repo, 'admin', { action: 'reset_password', target_user_id: USER, new_password: 'novasenha1' }), 'PASSWORD_INCOMPLETE');
  await code(manageUser(world({ fail: { deleteAuthUser: after } }).repo, 'admin', { action: 'delete', target_user_id: USER }), 'DELETE_INCOMPLETE');
});

// ---------- Role change concurrent with deactivation ----------
Deno.test('SAFE-X01 set_role intercalado com desativação -> fim inativo + banido; papel coerente', async () => {
  const w = world();
  const rpc = w.repo.setRoleAsCaller;
  w.repo.setRoleAsCaller = async (id, r) => { await rpc(id, r); await deact(w); };
  assertEquals(await manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' }), { ok: true });
  const s = w.state(USER);
  assertEquals([s.banned, s.ativo, s.role, s.roles, s.canonical], [true, false, 'entregador', ['entregador'], null]);
});
Deno.test('SAFE-X02 desativação intercalada antes do set_role -> continua inativo + banido', async () => {
  const w = world();
  const rpc = w.repo.setRoleAsCaller;
  w.repo.setRoleAsCaller = async (id, r) => { await deact(w); await rpc(id, r); };
  await manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'admin' });
  assertEquals([w.state(USER).ativo, w.state(USER).banned, w.state(USER).canonical], [false, true, null]);
});
