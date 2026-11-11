// G0.1 RELEASE CANDIDATE — NEW IMPLEMENTATION, revision 2 (main chat, 2026-11-03).
// Not deployed. Pure logic with an injected repository so it can be tested without a backend.
//
// Truthfulness rule: a write that throws may still have taken effect (lost response).
// So after the first write, any failure is reported as an INCOMPLETE operation that needs
// review — never as "nothing changed", "blocked" or "removed" unless a read-back confirmed it.

export const ROLES = ['admin', 'user', 'entregador'] as const;
export type Role = typeof ROLES[number];

export interface ProfileRow {
  id: string;
  organization_id: string | null;
  role: string | null;
  ativo: boolean | null;
  name?: string | null;
}

/** Every method must throw on backend error; "not found" is null / 0 rows. */
export interface AdminRepository {
  /**
   * True only when creating an account already banned has been validated for the
   * effective Auth version in an isolated environment. Default deployments: false.
   */
  readonly createBannedSupported: boolean;
  authenticate(token: string): Promise<string | null>;
  getProfile(id: string): Promise<ProfileRow | null>;
  getRoles(id: string): Promise<string[]>;
  /** Auth ban state: true = banned_until in the future, false = not banned, null = account missing. */
  getBanned(id: string): Promise<boolean | null>;
  /** Creates the Auth account already banned. Returns the id and the banned state reported by Auth. */
  createBannedAuthUser(input: { email: string; password: string; name: string }): Promise<{ id: string; banned: boolean }>;
  deleteAuthUser(id: string): Promise<void>;
  setBan(id: string, banned: boolean): Promise<void>;
  updateProfile(id: string, patch: Partial<Pick<ProfileRow, 'organization_id' | 'role' | 'ativo' | 'name'>>): Promise<number>;
  replaceRole(id: string, role: Role): Promise<void>;
  /** Role change executed with the caller's own JWT (set_user_role RPC). */
  setRoleAsCaller(id: string, role: Role): Promise<void>;
  resetPassword(id: string, password: string): Promise<void>;
}

export class AdminFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export const MSG = {
  CREATE_UNAVAILABLE: 'Criação de usuários indisponível nesta versão. Nenhuma conta foi criada.',
  PROVISIONING_INCOMPLETE: 'Operação incompleta: a conta pode ter sido criada sem todas as etapas. Confira login, perfil e papel antes de repetir.',
  DEACTIVATION_INCOMPLETE: 'Desativação incompleta ou não confirmada. Confira perfil e login do usuário antes de repetir.',
  REACTIVATION_INCOMPLETE: 'Reativação incompleta ou não confirmada. Confira perfil e login do usuário antes de repetir.',
  ROLE_CHANGE_INCOMPLETE: 'Troca de papel não confirmada. Confira o papel do usuário antes de repetir.',
  UPDATE_INCOMPLETE: 'Alteração não confirmada. Confira o cadastro antes de repetir.',
  PASSWORD_INCOMPLETE: 'Redefinição de senha não confirmada. Confira antes de repetir.',
  DELETE_INCOMPLETE: 'Exclusão não confirmada. Confira se a conta ainda existe antes de repetir.',
  SERVICE_UNAVAILABLE: 'Serviço indisponível. A operação não foi confirmada; confira o estado antes de repetir.',
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strictBody(body: unknown, allowed: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AdminFailure(400, 'INVALID_BODY', 'Corpo da requisição inválido.');
  const fields = body as Record<string, unknown>;
  const extra = Object.keys(fields).filter((k) => !allowed.includes(k));
  if (extra.length) throw new AdminFailure(400, 'FIELD_NOT_ALLOWED', `Campo não permitido: ${extra[0]}.`);
  return fields;
}
function str(v: unknown, field: string, min: number, max: number): string {
  if (typeof v !== 'string') throw new AdminFailure(400, 'INVALID_FIELD', `Campo inválido: ${field}.`);
  const t = field.includes('password') ? v : v.trim();
  if (t.length < min || t.length > max) throw new AdminFailure(400, 'INVALID_FIELD', `Campo inválido: ${field}.`);
  return t;
}
function role(v: unknown): Role {
  if (typeof v !== 'string' || !(ROLES as readonly string[]).includes(v)) throw new AdminFailure(400, 'INVALID_ROLE', 'Papel inválido.');
  return v as Role;
}
function uuid(v: unknown, field: string): string {
  if (typeof v !== 'string' || !UUID.test(v)) throw new AdminFailure(400, 'INVALID_FIELD', `Campo inválido: ${field}.`);
  return v.toLowerCase();
}
// 72 = bcrypt input limit used by the auth service.
const password = (v: unknown, field = 'password') => str(v, field, 8, 72);

const incomplete = (code: keyof typeof MSG) => new AdminFailure(500, code, MSG[code]);
/** Runs a write (and its read-back); any throw or failed check becomes the given INCOMPLETE error. */
async function step(code: keyof typeof MSG, fn: () => Promise<boolean | void>) {
  let ok: boolean | void;
  try { ok = await fn(); } catch { throw incomplete(code); }
  if (ok === false) throw incomplete(code);
}

/** Canonical verification: active profile, organization set, exactly one role row, profile.role equal to it. */
export function canonicalRole(profile: ProfileRow | null, roles: string[]): Role | null {
  if (!profile || profile.ativo !== true || !profile.organization_id) return null;
  if (roles.length !== 1 || !(ROLES as readonly string[]).includes(roles[0])) return null;
  if (profile.role !== roles[0]) return null;
  return roles[0] as Role;
}

export async function verifyAdmin(repo: AdminRepository, token: string) {
  const id = await repo.authenticate(token);
  if (!id) throw new AdminFailure(401, 'AUTH_REQUIRED', 'Sessão inválida.');
  const profile = await repo.getProfile(id);
  const r = canonicalRole(profile, await repo.getRoles(id));
  if (r !== 'admin') throw new AdminFailure(403, 'ADMIN_NOT_VERIFIED', 'Apenas administradores ativos e verificados.');
  return { id: id.toLowerCase(), organizationId: profile!.organization_id as string };
}

async function sameOrgTarget(repo: AdminRepository, callerOrg: string, targetId: string) {
  const target = await repo.getProfile(targetId);
  // Same response for "missing" and "other company" so organizations cannot be probed.
  if (!target || target.organization_id !== callerOrg) throw new AdminFailure(404, 'TARGET_NOT_FOUND', 'Usuário não encontrado na sua empresa.');
  return target;
}

export async function createUser(repo: AdminRepository, token: string, body: unknown) {
  const caller = await verifyAdmin(repo, token);
  const f = strictBody(body, ['email', 'password', 'name', 'role']);
  const email = str(f.email, 'email', 3, 254).toLowerCase();
  if (!EMAIL.test(email)) throw new AdminFailure(400, 'INVALID_FIELD', 'Campo inválido: email.');
  const pwd = password(f.password);
  const name = str(f.name, 'name', 2, 100);
  const r = role(f.role);

  // No unbanned window is acceptable. Without validated banned-at-creation support, refuse before any write.
  if (!repo.createBannedSupported) throw new AdminFailure(503, 'CREATE_UNAVAILABLE', MSG.CREATE_UNAVAILABLE);

  let created: { id: string; banned: boolean };
  try {
    created = await repo.createBannedAuthUser({ email, password: pwd, name });
  } catch (e) {
    const msg = String((e as Error)?.message ?? '');
    if (/already|registered|exists/i.test(msg)) throw new AdminFailure(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado.');
    throw incomplete('PROVISIONING_INCOMPLETE'); // lost response: account may exist
  }
  const id = created.id;
  // Auth must report the account banned at creation; otherwise stop (no compensating delete is relied on).
  await step('PROVISIONING_INCOMPLETE', async () => created.banned === true && (await repo.getBanned(id)) === true);
  await step('PROVISIONING_INCOMPLETE', async () =>
    (await repo.updateProfile(id, { organization_id: caller.organizationId, role: r, name, ativo: true })) === 1);
  await step('PROVISIONING_INCOMPLETE', () => repo.replaceRole(id, r));
  await step('PROVISIONING_INCOMPLETE', async () => {
    const p = await repo.getProfile(id);
    return p?.organization_id === caller.organizationId && canonicalRole(p, await repo.getRoles(id)) === r;
  });
  // Organizations created by the signup trigger are NOT removed here (see PROVISIONING_LIMITATIONS.md).
  await step('PROVISIONING_INCOMPLETE', async () => { await repo.setBan(id, false); return (await repo.getBanned(id)) === false; });
  return { user: { id, name, role: r } };
}

export async function manageUser(repo: AdminRepository, token: string, body: unknown) {
  const caller = await verifyAdmin(repo, token);
  const action = (body && typeof body === 'object' && !Array.isArray(body)) ? (body as Record<string, unknown>).action : undefined;
  const allowed: Record<string, string[]> = {
    reset_password: ['action', 'target_user_id', 'new_password'],
    toggle_active: ['action', 'target_user_id', 'active'],
    delete: ['action', 'target_user_id'],
    set_role: ['action', 'target_user_id', 'role'],
    update_profile: ['action', 'target_user_id', 'name'],
  };
  if (typeof action !== 'string' || !allowed[action]) throw new AdminFailure(400, 'INVALID_ACTION', 'Ação inválida.');
  const f = strictBody(body, allowed[action]);
  const targetId = uuid(f.target_user_id, 'target_user_id');
  if (targetId === caller.id) throw new AdminFailure(403, 'SELF_CHANGE_FORBIDDEN', 'Você não pode alterar a própria conta por aqui.');

  // Validate all inputs before touching the target.
  const pwd = action === 'reset_password' ? password(f.new_password, 'new_password') : '';
  if (action === 'toggle_active' && typeof f.active !== 'boolean') throw new AdminFailure(400, 'INVALID_FIELD', 'Campo inválido: active.');
  const newRole = action === 'set_role' ? role(f.role) : null;
  const newName = action === 'update_profile' ? str(f.name, 'name', 2, 100) : '';

  const target = await sameOrgTarget(repo, caller.organizationId, targetId);

  switch (action) {
    case 'reset_password':
      await step('PASSWORD_INCOMPLETE', () => repo.resetPassword(targetId, pwd));
      break;
    case 'toggle_active':
      if (f.active === false) {
        // 1) profile ativo=false: denies the existing token only where the backend checks ativo.
        // 2) Auth ban: denies new password login and token refresh. Does not revoke issued access tokens.
        await step('DEACTIVATION_INCOMPLETE', async () => (await repo.updateProfile(targetId, { ativo: false })) === 1);
        await step('DEACTIVATION_INCOMPLETE', async () => { await repo.setBan(targetId, true); return true; });
        await step('DEACTIVATION_INCOMPLETE', async () =>
          (await repo.getProfile(targetId))?.ativo === false && (await repo.getBanned(targetId)) === true);
      } else {
        const roles = await repo.getRoles(targetId);
        if (roles.length !== 1 || target.role !== roles[0] || !(ROLES as readonly string[]).includes(roles[0])) {
          throw new AdminFailure(409, 'ROLE_NOT_VERIFIED', 'Papel do usuário inconsistente; corrija o papel antes de reativar. Nada foi gravado.');
        }
        // Profile first, unban last: login is only released after the profile is confirmed active.
        await step('REACTIVATION_INCOMPLETE', async () => (await repo.updateProfile(targetId, { ativo: true })) === 1);
        await step('REACTIVATION_INCOMPLETE', async () => (await repo.getProfile(targetId))?.ativo === true);
        await step('REACTIVATION_INCOMPLETE', async () => { await repo.setBan(targetId, false); return (await repo.getBanned(targetId)) === false; });
      }
      break;
    case 'delete':
      await step('DELETE_INCOMPLETE', async () => { await repo.deleteAuthUser(targetId); return (await repo.getBanned(targetId)) === null; });
      break;
    case 'set_role':
      await step('ROLE_CHANGE_INCOMPLETE', async () => {
        await repo.setRoleAsCaller(targetId, newRole!);
        const p = await repo.getProfile(targetId);
        const roles = await repo.getRoles(targetId);
        return !!p && p.role === newRole && roles.length === 1 && roles[0] === newRole;
      });
      break;
    case 'update_profile':
      await step('UPDATE_INCOMPLETE', async () => (await repo.updateProfile(targetId, { name: newName })) === 1);
      break;
  }
  return { ok: true };
}

export function makeAdminHandler(
  op: (repo: AdminRepository, token: string, body: unknown) => Promise<unknown>,
  repository: (token: string) => AdminRepository,
  cors: Record<string, string>,
  log: (code: string) => void = () => {},
) {
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), {
    status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return json({ code: 'METHOD_NOT_ALLOWED', error: 'Método não permitido.' }, 405);
    try {
      const m = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i);
      if (!m) throw new AdminFailure(401, 'AUTH_REQUIRED', 'Sessão inválida.');
      let body: unknown;
      try { body = await req.json(); } catch { throw new AdminFailure(400, 'INVALID_JSON', 'JSON inválido.'); }
      return json(await op(repository(m[1]), m[1], body));
    } catch (e) {
      if (e instanceof AdminFailure) { log(e.code); return json({ code: e.code, error: e.message }, e.status); }
      log('SERVICE_UNAVAILABLE');
      return json({ code: 'SERVICE_UNAVAILABLE', error: MSG.SERVICE_UNAVAILABLE }, 503);
    }
  };
}
