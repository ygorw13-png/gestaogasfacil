// Deno tests for the G0.1 admin candidate, revision 2 — SAFE-STATE tests (mocks, fictional data).
import { assertEquals } from 'jsr:@std/assert@1';
import { createUser, makeAdminHandler, manageUser, MSG } from '../candidate/supabase/functions/_shared/g01-admin-core.ts';
import { ADMIN, code, NEW, NEW_ORG, ORG_A, ORG_B, OTHER, USER, valid, world } from './admin-world.ts';

// --- caller verification
Deno.test('01 token desconhecido -> AUTH_REQUIRED', async () => { const w = world(); await code(createUser(w.repo, 'x', valid), 'AUTH_REQUIRED'); });
Deno.test('02 usuário comum não administra', async () => { const w = world(); await code(createUser(w.repo, 'user', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('03 admin inativo bloqueado', async () => { const w = world(); w.profiles.get(ADMIN)!.ativo = false; await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('04 admin com ativo nulo bloqueado', async () => { const w = world(); w.profiles.get(ADMIN)!.ativo = null; await code(manageUser(w.repo, 'admin', { action: 'delete', target_user_id: USER }), 'ADMIN_NOT_VERIFIED'); });
Deno.test('05 admin sem empresa bloqueado', async () => { const w = world(); w.profiles.get(ADMIN)!.organization_id = null; await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('06 papel do perfil diverge de user_roles', async () => { const w = world(); w.profiles.get(ADMIN)!.role = 'user'; await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('07 dois papéis em user_roles bloqueado', async () => { const w = world(); w.roles.set(ADMIN, ['admin', 'user']); await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); });
Deno.test('08 perfil ausente bloqueado (sem recriação)', async () => { const w = world(); w.profiles.delete(ADMIN); await code(createUser(w.repo, 'admin', valid), 'ADMIN_NOT_VERIFIED'); assertEquals(w.profiles.has(ADMIN), false); });

// --- strict validation (no write may happen)
const noWrite = (w: ReturnType<typeof world>) => assertEquals(w.log.some((k) => !['authenticate', 'getProfile', 'getRoles'].includes(k)), false);
Deno.test('09 campo extra rejeitado (organization_id)', async () => { const w = world(); await code(createUser(w.repo, 'admin', { ...valid, organization_id: ORG_B }), 'FIELD_NOT_ALLOWED'); noWrite(w); });
Deno.test('10 papel fora dos três rejeitado', async () => { const w = world(); await code(createUser(w.repo, 'admin', { ...valid, role: 'gerente' }), 'INVALID_ROLE'); noWrite(w); });
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
Deno.test('19 sem suporte validado a criar bloqueado -> CREATE_UNAVAILABLE, nenhuma conta criada', async () => {
  const w = world({ createBanned: false });
  await code(createUser(w.repo, 'admin', valid), 'CREATE_UNAVAILABLE');
  assertEquals(w.authUsers.has(NEW), false); noWrite(w);
});
Deno.test('20 criação completa: nasce bloqueada, desbloqueio é a última gravação', async () => {
  const w = world();
  const r = await createUser(w.repo, 'admin', valid);
  assertEquals(r, { user: { id: NEW, name: 'Novo Teste', role: 'entregador' } });
  const s = w.state(NEW);
  assertEquals([s.org, s.role, s.ativo, s.roles, s.banned], [ORG_A, 'entregador', true, ['entregador'], false]);
  assertEquals(w.log.indexOf('setBan') > w.log.lastIndexOf('replaceRole'), true);
  assertEquals(w.log.filter((k) => k === 'setBan').length, 1); // only the final unban
});
Deno.test('21 empresas preexistentes e a criada pelo trigger são preservadas', async () => {
  const w = world();
  await createUser(w.repo, 'admin', valid);
  assertEquals([...w.orgs.keys()].sort(), [ORG_A, ORG_B, NEW_ORG].sort());
  assertEquals(w.log.includes('deleteAuthUser'), false);
});
Deno.test('22 e-mail duplicado -> 409', async () => {
  const w = world(); w.repo.createBannedAuthUser = async () => { throw new Error('User already registered'); };
  await code(createUser(w.repo, 'admin', valid), 'EMAIL_IN_USE');
});

// --- manage: scope & self
Deno.test('23 alvo de outra empresa -> 404 sem gravação', async () => {
  const w = world();
  for (const b of [{ action: 'delete' }, { action: 'toggle_active', active: false }, { action: 'set_role', role: 'admin' }, { action: 'reset_password', new_password: 'novasenha1' }, { action: 'update_profile', name: 'X Y' }]) {
    await code(manageUser(w.repo, 'admin', { ...b, target_user_id: OTHER }), 'TARGET_NOT_FOUND');
  }
  noWrite(w);
});
Deno.test('24 alvo inexistente -> mesma resposta 404', async () => { const w = world(); await code(manageUser(w.repo, 'admin', { action: 'delete', target_user_id: NEW }), 'TARGET_NOT_FOUND'); });
Deno.test('25 autoalteração bloqueada em todas as ações', async () => {
  const w = world();
  for (const b of [{ action: 'delete' }, { action: 'toggle_active', active: false }, { action: 'set_role', role: 'user' }, { action: 'reset_password', new_password: 'novasenha1' }, { action: 'update_profile', name: 'Ana B' }]) {
    await code(manageUser(w.repo, 'admin', { ...b, target_user_id: ADMIN.toUpperCase() }), 'SELF_CHANGE_FORBIDDEN');
  }
  noWrite(w);
});

// --- manage: success paths
Deno.test('26 desativação: perfil inativo antes do ban, ambos confirmados por leitura', async () => {
  const w = world();
  assertEquals(await manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: false }), { ok: true });
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [false, true]);
  assertEquals(w.log.lastIndexOf('updateProfile') < w.log.lastIndexOf('setBan'), true);
  assertEquals(w.log.at(-1), 'getBanned');
});
Deno.test('27 reativação: perfil ativo antes do desbloqueio', async () => {
  const w = world(); w.profiles.get(USER)!.ativo = false; w.banned.add(USER);
  await manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true });
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [true, false]);
  assertEquals(w.log.lastIndexOf('updateProfile') < w.log.lastIndexOf('setBan'), true);
});
Deno.test('28 reativação com papel inconsistente recusada sem gravação', async () => {
  const w = world(); w.profiles.get(USER)!.ativo = false; w.banned.add(USER); w.roles.set(USER, []);
  await code(manageUser(w.repo, 'admin', { action: 'toggle_active', target_user_id: USER, active: true }), 'ROLE_NOT_VERIFIED',
    'Papel do usuário inconsistente; corrija o papel antes de reativar. Nada foi gravado.');
  assertEquals([w.state(USER).ativo, w.state(USER).banned], [false, true]);
});
Deno.test('29 troca de papel via RPC do próprio admin + leitura de confirmação', async () => {
  const w = world();
  await manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' });
  assertEquals([w.state(USER).role, w.state(USER).roles], ['entregador', ['entregador']]);
  assertEquals(w.log.includes('replaceRole'), false);
});
Deno.test('30 troca de papel sem efeito -> ROLE_CHANGE_INCOMPLETE', async () => {
  const w = world(); w.repo.setRoleAsCaller = async () => {};
  await code(manageUser(w.repo, 'admin', { action: 'set_role', target_user_id: USER, role: 'entregador' }), 'ROLE_CHANGE_INCOMPLETE');
});
Deno.test('31 edição comum altera só o nome', async () => {
  const w = world();
  await manageUser(w.repo, 'admin', { action: 'update_profile', target_user_id: USER, name: '  Beto Silva ' });
  const p = w.profiles.get(USER)!; assertEquals([p.name, p.role, p.ativo, p.organization_id], ['Beto Silva', 'user', true, ORG_A]);
});
Deno.test('32 redefinição de senha e exclusão confirmada', async () => {
  const w = world();
  await manageUser(w.repo, 'admin', { action: 'reset_password', target_user_id: USER, new_password: 'novasenha1' });
  await manageUser(w.repo, 'admin', { action: 'delete', target_user_id: USER });
  assertEquals(w.authUsers.has(USER), false);
});

// --- HTTP handler
const H = (op: typeof createUser, w: ReturnType<typeof world>) => makeAdminHandler(op, () => w.repo, { 'Access-Control-Allow-Origin': '*' });
const post = (body: string, auth = 'Bearer admin') => new Request('http://x', { method: 'POST', headers: { Authorization: auth }, body });
Deno.test('33 handler: sem Bearer -> 401; GET -> 405; JSON inválido -> 400', async () => {
  const w = world(), h = H(createUser, w);
  const rs = [await h(new Request('http://x', { method: 'POST', body: '{}' })), await h(new Request('http://x', { method: 'GET' })), await h(post('{'))];
  assertEquals(rs.map((r) => r.status), [401, 405, 400]); for (const r of rs) await r.text();
});
Deno.test('34 handler: erro inesperado -> 503, mensagem de não confirmação, sem detalhes internos', async () => {
  const w = world({ fail: { getProfile: { when: 'before' } } }), h = H(createUser, w);
  const r = await h(post(JSON.stringify(valid)));
  assertEquals(r.status, 503); const b = await r.json();
  assertEquals([b.code, b.error], ['SERVICE_UNAVAILABLE', MSG.SERVICE_UNAVAILABLE]); assertEquals(JSON.stringify(b).includes('boom'), false);
});
Deno.test('35 handler: sucesso mantém formato usado pela tela', async () => {
  const w = world(), h = H(createUser, w);
  const r = await h(post(JSON.stringify(valid)));
  assertEquals(r.status, 200); assertEquals((await r.json()).user.role, 'entregador'); assertEquals(r.headers.get('Cache-Control'), 'no-store');
});
Deno.test('36 handler: criação indisponível -> 503 CREATE_UNAVAILABLE', async () => {
  const w = world({ createBanned: false }), h = H(createUser, w);
  const r = await h(post(JSON.stringify(valid))); const b = await r.json();
  assertEquals([r.status, b.code, b.error], [503, 'CREATE_UNAVAILABLE', MSG.CREATE_UNAVAILABLE]);
});
