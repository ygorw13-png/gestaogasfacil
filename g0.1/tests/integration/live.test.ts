// G0.1 REAL INTEGRATION SUITE — runs only against a disposable loopback stack:
// PostgreSQL (schema rebuilt from supabase/migrations + g0.1/sql/001), Auth (GoTrue) and PostgREST,
// plus g0.1/tests/integration/gateway.ts serving the real candidate endpoints.
// Refuses to run unless SUPABASE_URL is loopback. Fictional example.invalid accounts only.
// Fault injection wraps the real network calls (fail-before-send / lose-response-after-effect);
// the Auth, database, RPC and policies are all real.
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { createClient } from 'npm:@supabase/supabase-js@2.106.2';
import { createUser, manageUser, MSG } from '../../candidate/supabase/functions/_shared/g01-admin-core.ts';
import { makeRepository } from '../../candidate/supabase/functions/_shared/g01-admin.ts';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PGURL = Deno.env.get('ISO_PG_URL')!; // loopback disposable cluster
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(URL_) || !/@127\.0\.0\.1:\d+\//.test(PGURL)) throw new Error('REFUSING: not a loopback isolated stack');

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const anonClient = () => createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const PW = 'Iso-' + crypto.randomUUID();
const run = crypto.randomUUID().slice(0, 8);
const email = (n: string) => `${n}-${run}@example.invalid`;

async function sql(q: string): Promise<string> {
  const p = new Deno.Command('psql', { args: [PGURL, '-tA', '-F', '|', '-c', q], stdout: 'piped', stderr: 'piped', env: { PGCONNECT_TIMEOUT: '5' } });
  const o = await p.output();
  if (!o.success) throw new Error(new TextDecoder().decode(o.stderr));
  return new TextDecoder().decode(o.stdout).trim();
}
async function login(e: string, pw = PW) {
  const c = anonClient();
  const r = await c.auth.signInWithPassword({ email: e, password: pw });
  return { c, ...r };
}
async function fn(name: string, token: string, body: unknown) {
  const r = await fetch(`${URL_}/functions/v1/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json() };
}
async function state(id: string) {
  return await sql(`select coalesce(p.ativo::text,'-'), coalesce(p.role,'-'), coalesce(p.organization_id::text,'-'),
    coalesce((select string_agg(role::text,',') from public.user_roles where user_id='${id}'),'-'),
    case when u.id is null then 'nouser' else coalesce(u.banned_until > now(), false)::text end from auth.users u full join public.profiles p on p.id=u.id
    where coalesce(u.id,p.id)='${id}'`);
}
/** Bootstrap admin through the platform's own signup trigger (new org + admin profile). */
async function bootstrapAdmin(n: string) {
  const { data, error } = await admin.auth.admin.createUser({ email: email(n), password: PW, email_confirm: true, user_metadata: { name: n } });
  if (error) throw error;
  const org = await sql(`select organization_id from public.profiles where id='${data.user!.id}'`);
  return { id: data.user!.id, email: email(n), org };
}

// ---- fault injection over real network calls ----
type Fault = { match: (u: string, m: string, b: string) => boolean; mode: 'before' | 'lost' };
let faults: Fault[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const m = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const b = typeof init?.body === 'string' ? init.body : '';
  const i = faults.findIndex((f) => f.match(u, m, b));
  if (i >= 0) {
    const f = faults.splice(i, 1)[0];
    if (f.mode === 'before') throw new TypeError('injected: connection failed before send');
    await (await realFetch(input, init)).arrayBuffer(); // effect happens
    throw new TypeError('injected: response lost after effect');
  }
  return realFetch(input, init);
};
const authUserPost = (u: string, m: string) => m === 'POST' && /\/auth\/v1\/admin\/users$/.test(u);
const banPut = (want: 'ban' | 'unban') => (u: string, m: string, b: string) =>
  m === 'PUT' && /\/auth\/v1\/admin\/users\/[0-9a-f-]+$/.test(u) && b.includes(want === 'ban' ? '876000h' : '"none"');
const profilePatch = (u: string, m: string) => m === 'PATCH' && u.includes('/rest/v1/profiles');
const rpcRole = (u: string, m: string) => m === 'POST' && u.includes('/rest/v1/rpc/set_user_role');

async function core(op: typeof createUser | typeof manageUser, token: string, body: unknown) {
  try { return { ok: true, v: await op(makeRepository(token), token, body) as Record<string, any> }; }
  catch (e) { return { ok: false, code: (e as any).code as string, message: (e as Error).message }; }
}

const A = await bootstrapAdmin('adminA');
const B = await bootstrapAdmin('adminB');
const tokA = (await login(A.email)).data.session!.access_token;
const tokB = (await login(B.email)).data.session!.access_token;
const opts = { sanitizeOps: false, sanitizeResources: false };
let courierId = '';

Deno.test({ name: 'L01 admin password login works and profile is canonical admin', ...opts, fn: async () => {
  const { c, error } = await login(A.email);
  assertEquals(error, null);
  const { data } = await c.from('profiles').select('role, ativo, organization_id').eq('id', A.id).single();
  assertEquals(data, { role: 'admin', ativo: true, organization_id: A.org });
} });

Deno.test({ name: 'L02 create-user via gateway with flag OFF: 503 CREATE_UNAVAILABLE and no account', ...opts, fn: async () => {
  const before = await sql(`select count(*) from auth.users`);
  const r = await fn('create-user', tokA, { email: email('off'), password: PW, name: 'Off', role: 'entregador' });
  assertEquals(r.status, 503);
  assertEquals(r.body, { code: 'CREATE_UNAVAILABLE', error: MSG.CREATE_UNAVAILABLE });
  assertEquals(await sql(`select count(*) from auth.users`), before);
} });

Deno.test({ name: 'L03 Auth createUser with ban_duration: INSERT and ban commit in ONE transaction; login refused', ...opts, fn: async () => {
  await sql(`truncate public.iso_auth_audit`);
  const { data, error } = await admin.auth.admin.createUser({ email: email('probe'), password: PW, email_confirm: true, ban_duration: '876000h' });
  assertEquals(error, null);
  assert(Date.parse(data.user!.banned_until!) > Date.now());
  const rows = (await sql(`select op||':'||(banned_until is not null)||':'||tx from public.iso_auth_audit where id='${data.user!.id}' order by at`)).split('\n');
  assertEquals(new Set(rows.map((r) => r.split(':')[2])).size, 1, 'all writes in the same transaction');
  assert(rows.at(-1)!.includes(':true:'), 'committed row is banned');
  const l = await login(email('probe'));
  assertEquals((l.error as any)?.code, 'user_banned');
} });

Deno.test({ name: 'L04 create-user (flag ON, real stack): final org A, role entregador, single role, unbanned; extra org remains', ...opts, fn: async () => {
  Deno.env.set('G01_CREATE_BANNED_VALIDATED', 'true');
  try {
    await sql(`truncate public.iso_auth_audit`);
    const r = await core(createUser, tokA, { email: email('courier'), password: PW, name: 'Entregador Ficticio', role: 'entregador' });
    assert(r.ok, JSON.stringify(r));
    courierId = r.v!.user.id;
    assertEquals(await state(courierId), `true|entregador|${A.org}|entregador|false`);
    const ins = await sql(`select (banned_until is not null) from public.iso_auth_audit where id='${courierId}' and tx=(select min(tx) from public.iso_auth_audit where id='${courierId}') order by at desc limit 1`);
    assertEquals(ins, 't', 'creation transaction committed banned');
    assertEquals(await sql(`select count(*) from public.organizations where owner_id='${courierId}'`), '1', 'LIMITATION: trigger org is left (not deleted)');
  } finally { Deno.env.delete('G01_CREATE_BANNED_VALIDATED'); }
} });

Deno.test({ name: 'L05 entregador login works and sees only own org via get_my_org', ...opts, fn: async () => {
  const { c, error } = await login(email('courier'));
  assertEquals(error, null);
  const { data } = await c.rpc('get_my_org');
  assertEquals(data, A.org);
} });

Deno.test({ name: 'L06 deactivation via gateway; new login and refresh refused; pre-issued token behaviour recorded', ...opts, fn: async () => {
  const pre = await login(email('courier'));
  const t0 = pre.data.session!;
  const r = await fn('manage-user', tokA, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals(r, { status: 200, body: { ok: true } });
  assertEquals(await state(courierId), `false|entregador|${A.org}|entregador|true`);
  assertEquals(((await login(email('courier'))).error as any)?.code, 'user_banned');
  const ref = await anonClient().auth.refreshSession({ refresh_token: t0.refresh_token });
  assert(ref.error, 'refresh must fail after ban');
  // Pre-issued access token still verifies cryptographically until exp:
  const old = createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${t0.access_token}` } }, auth: { persistSession: false } });
  const org = await old.rpc('get_my_org');
  const orders = await old.from('orders').select('id').limit(1);
  const ownProfile = await old.from('profiles').select('ativo').eq('id', courierId).maybeSingle();
  console.log('PRE-ISSUED TOKEN after deactivation:', JSON.stringify({ get_my_org: org.data === A.org ? 'returns org A' : org.error?.message ?? org.data, orders_select: orders.error ? `denied ${orders.error.code}` : `allowed (${orders.data?.length} rows)`, own_profile: ownProfile.data }));
  assertEquals(org.data, A.org, 'LIMITATION confirmed: get_my_org does not check ativo');
  assertEquals(orders.error, null, 'LIMITATION confirmed: operational policies accept the old token');
  // Edge endpoints validate the token with Auth (getUser), which rejects banned users even with a valid JWT.
  const asAdmin = await fn('manage-user', t0.access_token, { action: 'update_profile', target_user_id: A.id, name: 'x' });
  assertEquals([asAdmin.status, asAdmin.body.code], [401, 'AUTH_REQUIRED']);
} });

Deno.test({ name: 'L07 reactivation via gateway restores login', ...opts, fn: async () => {
  const r = await fn('manage-user', tokA, { action: 'toggle_active', target_user_id: courierId, active: true });
  assertEquals(r, { status: 200, body: { ok: true } });
  assertEquals(await state(courierId), `true|entregador|${A.org}|entregador|false`);
  assertEquals((await login(email('courier'))).error, null);
} });

Deno.test({ name: 'L08 role change via gateway (set_user_role RPC with caller JWT)', ...opts, fn: async () => {
  assertEquals(await fn('manage-user', tokA, { action: 'set_role', target_user_id: courierId, role: 'user' }), { status: 200, body: { ok: true } });
  assertEquals(await state(courierId), `true|user|${A.org}|user|false`);
  assertEquals(await fn('manage-user', tokA, { action: 'set_role', target_user_id: courierId, role: 'entregador' }), { status: 200, body: { ok: true } });
} });

Deno.test({ name: 'L09 refusals: other company 404, self-change 403, non-admin 403, inactive admin pre-issued token 403', ...opts, fn: async () => {
  const other = await fn('manage-user', tokB, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals(other.status, 404); assertEquals(other.body.code, 'TARGET_NOT_FOUND');
  assertEquals((await fn('manage-user', tokA, { action: 'set_role', target_user_id: A.id, role: 'user' })).body.code, 'SELF_CHANGE_FORBIDDEN');
  const ct = (await login(email('courier'))).data.session!.access_token;
  assertEquals((await fn('manage-user', ct, { action: 'update_profile', target_user_id: A.id, name: 'x' })).body.code, 'ADMIN_NOT_VERIFIED');
  // Second admin in org A, token issued, then deactivated by A.
  Deno.env.set('G01_CREATE_BANNED_VALIDATED', 'true');
  const a2 = await core(createUser, tokA, { email: email('admin2'), password: PW, name: 'Admin Dois', role: 'admin' });
  Deno.env.delete('G01_CREATE_BANNED_VALIDATED');
  assert(a2.ok, JSON.stringify(a2));
  const t2 = (await login(email('admin2'))).data.session!.access_token;
  assertEquals((await fn('manage-user', tokA, { action: 'toggle_active', target_user_id: a2.v!.user.id, active: false })).status, 200);
  const denied = await fn('manage-user', t2, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals([denied.status, denied.body.code], [401, 'AUTH_REQUIRED'], 'banned: Auth rejects the pre-issued token');
  // Inactive in profile but NOT banned in Auth (the F05 residual state): backend ativo check must refuse.
  await sql(`update auth.users set banned_until=null where id='${a2.v!.user.id}'`);
  const t3 = (await login(email('admin2'))).data.session!.access_token;
  await sql(`update public.profiles set ativo=false where id='${a2.v!.user.id}'`);
  const inactive = await fn('manage-user', t3, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals([inactive.status, inactive.body.code], [403, 'ADMIN_NOT_VERIFIED']);
  const rpc = await createClient(URL_, ANON, { global: { headers: { Authorization: `Bearer ${t2}` } }, auth: { persistSession: false } })
    .rpc('set_user_role', { _user_id: courierId, _role: 'admin' });
  assert(rpc.error, 'inactive admin old token refused by set_user_role');
  assertEquals(await state(courierId), `true|entregador|${A.org}|entregador|false`);
} });

Deno.test({ name: 'L10 concurrent role change + deactivation: final state consistent (canonical role, inactive, banned)', ...opts, fn: async () => {
  const [r1, r2] = await Promise.all([
    fn('manage-user', tokA, { action: 'set_role', target_user_id: courierId, role: 'user' }),
    fn('manage-user', tokA, { action: 'toggle_active', target_user_id: courierId, active: false }),
  ]);
  console.log('CONCURRENT results:', r1.status, r1.body.code ?? 'ok', r2.status, r2.body.code ?? 'ok', '->', await state(courierId));
  const [ativo, prole, , roles, banned] = (await state(courierId)).split('|');
  assertEquals(prole, roles, 'profile.role equals the single user_roles row');
  if (r2.status === 200) { assertEquals(ativo, 'false'); assertEquals(banned, 'true'); }
  // restore for next tests
  await fn('manage-user', tokA, { action: 'set_role', target_user_id: courierId, role: 'entregador' });
  assertEquals((await fn('manage-user', tokA, { action: 'toggle_active', target_user_id: courierId, active: true })).status, 200);
} });

// ---- intermediate failures and lost responses (real backend, injected network faults) ----
Deno.test({ name: 'F01 create: Auth response lost after account creation -> PROVISIONING_INCOMPLETE; account exists BANNED', ...opts, fn: async () => {
  Deno.env.set('G01_CREATE_BANNED_VALIDATED', 'true');
  faults = [{ match: authUserPost, mode: 'lost' }];
  const r = await core(createUser, tokA, { email: email('lost1'), password: PW, name: 'Lost Um', role: 'entregador' });
  Deno.env.delete('G01_CREATE_BANNED_VALIDATED');
  assertEquals([r.code, r.message], ['PROVISIONING_INCOMPLETE', MSG.PROVISIONING_INCOMPLETE]);
  const id = await sql(`select id from auth.users where email='${email('lost1')}'`);
  console.log('F01 state', await state(id));
  assert((await state(id)).endsWith('|true'), 'residual account is banned');
  assertEquals(((await login(email('lost1'))).error as any)?.code, 'user_banned');
} });

Deno.test({ name: 'F02 create: profile update fails before send -> INCOMPLETE; account banned with trigger admin profile in extra org', ...opts, fn: async () => {
  Deno.env.set('G01_CREATE_BANNED_VALIDATED', 'true');
  faults = [{ match: profilePatch, mode: 'before' }];
  const r = await core(createUser, tokA, { email: email('fail2'), password: PW, name: 'Falha Dois', role: 'entregador' });
  Deno.env.delete('G01_CREATE_BANNED_VALIDATED');
  assertEquals(r.code, 'PROVISIONING_INCOMPLETE');
  const id = await sql(`select id from auth.users where email='${email('fail2')}'`);
  const s = await state(id); console.log('F02 state', s);
  assert(s.endsWith('|true')); assert(!s.includes(A.org), 'not attached to org A');
  assertEquals(((await login(email('fail2'))).error as any)?.code, 'user_banned');
} });

Deno.test({ name: 'F03 create: unban response lost -> INCOMPLETE although account is actually ready and unbanned', ...opts, fn: async () => {
  Deno.env.set('G01_CREATE_BANNED_VALIDATED', 'true');
  faults = [{ match: banPut('unban'), mode: 'lost' }];
  const r = await core(createUser, tokA, { email: email('lost3'), password: PW, name: 'Lost Tres', role: 'user' });
  Deno.env.delete('G01_CREATE_BANNED_VALIDATED');
  assertEquals(r.code, 'PROVISIONING_INCOMPLETE');
  const id = await sql(`select id from auth.users where email='${email('lost3')}'`);
  assertEquals(await state(id), `true|user|${A.org}|user|false`);
} });

Deno.test({ name: 'F04 deactivate: profile PATCH response lost -> DEACTIVATION_INCOMPLETE; profile inactive, NOT banned', ...opts, fn: async () => {
  faults = [{ match: profilePatch, mode: 'lost' }];
  const r = await core(manageUser, tokA, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals([r.code, r.message], ['DEACTIVATION_INCOMPLETE', MSG.DEACTIVATION_INCOMPLETE]);
  assertEquals(await state(courierId), `false|entregador|${A.org}|entregador|false`);
  console.log('F04: new login still possible =', (await login(email('courier'))).error === null);
} });

Deno.test({ name: 'F05 deactivate: ban fails before send -> INCOMPLETE; profile inactive, login NOT blocked', ...opts, fn: async () => {
  await fn('manage-user', tokA, { action: 'toggle_active', target_user_id: courierId, active: true });
  faults = [{ match: banPut('ban'), mode: 'before' }];
  const r = await core(manageUser, tokA, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals(r.code, 'DEACTIVATION_INCOMPLETE');
  assertEquals(await state(courierId), `false|entregador|${A.org}|entregador|false`);
  assertEquals((await login(email('courier'))).error, null, 'documented: Auth ban absent, password login works');
} });

Deno.test({ name: 'F06 deactivate: ban response lost -> INCOMPLETE although fully deactivated', ...opts, fn: async () => {
  faults = [{ match: banPut('ban'), mode: 'lost' }];
  const r = await core(manageUser, tokA, { action: 'toggle_active', target_user_id: courierId, active: false });
  assertEquals(r.code, 'DEACTIVATION_INCOMPLETE');
  assertEquals(await state(courierId), `false|entregador|${A.org}|entregador|true`);
} });

Deno.test({ name: 'F07 reactivate: profile PATCH fails before send -> REACTIVATION_INCOMPLETE; stays inactive and banned', ...opts, fn: async () => {
  faults = [{ match: profilePatch, mode: 'before' }];
  const r = await core(manageUser, tokA, { action: 'toggle_active', target_user_id: courierId, active: true });
  assertEquals([r.code, r.message], ['REACTIVATION_INCOMPLETE', MSG.REACTIVATION_INCOMPLETE]);
  assertEquals(await state(courierId), `false|entregador|${A.org}|entregador|true`);
} });

Deno.test({ name: 'F08 reactivate: unban fails before send -> INCOMPLETE; profile active but login still blocked', ...opts, fn: async () => {
  faults = [{ match: banPut('unban'), mode: 'before' }];
  const r = await core(manageUser, tokA, { action: 'toggle_active', target_user_id: courierId, active: true });
  assertEquals(r.code, 'REACTIVATION_INCOMPLETE');
  assertEquals(await state(courierId), `true|entregador|${A.org}|entregador|true`);
  assertEquals(((await login(email('courier'))).error as any)?.code, 'user_banned');
} });

Deno.test({ name: 'F09 reactivate: unban response lost -> INCOMPLETE although fully reactivated', ...opts, fn: async () => {
  faults = [{ match: banPut('unban'), mode: 'lost' }];
  const r = await core(manageUser, tokA, { action: 'toggle_active', target_user_id: courierId, active: true });
  assertEquals(r.code, 'REACTIVATION_INCOMPLETE');
  assertEquals(await state(courierId), `true|entregador|${A.org}|entregador|false`);
} });

Deno.test({ name: 'F10 set_role: RPC response lost -> ROLE_CHANGE_INCOMPLETE; role actually changed atomically', ...opts, fn: async () => {
  faults = [{ match: rpcRole, mode: 'lost' }];
  const r = await core(manageUser, tokA, { action: 'set_role', target_user_id: courierId, role: 'user' });
  assertEquals([r.code, r.message], ['ROLE_CHANGE_INCOMPLETE', MSG.ROLE_CHANGE_INCOMPLETE]);
  assertEquals(await state(courierId), `true|user|${A.org}|user|false`);
} });

Deno.test({ name: 'F11 set_role: RPC fails before send -> INCOMPLETE; role unchanged', ...opts, fn: async () => {
  faults = [{ match: rpcRole, mode: 'before' }];
  const r = await core(manageUser, tokA, { action: 'set_role', target_user_id: courierId, role: 'admin' });
  assertEquals(r.code, 'ROLE_CHANGE_INCOMPLETE');
  assertEquals(await state(courierId), `true|user|${A.org}|user|false`);
  assertEquals(faults.length, 0);
} });
