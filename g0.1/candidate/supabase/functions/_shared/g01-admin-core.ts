// G0.1 RELEASE CANDIDATE — NEW IMPLEMENTATION (main chat, 2026-11-03).
// Not deployed. Pure logic with an injected repository so it can be tested without a backend.

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
  authenticate(token: string): Promise<string | null>;
  getProfile(id: string): Promise<ProfileRow | null>;
  getRoles(id: string): Promise<string[]>;
  // provisioning
  createAuthUser(input: { email: string; password: string; name: string }): Promise<string>;
  deleteAuthUser(id: string): Promise<void>;
  setBan(id: string, banned: boolean): Promise<void>;
  updateProfile(id: string, patch: Partial<Pick<ProfileRow, 'organization_id' | 'role' | 'ativo' | 'name'>>): Promise<number>;
  replaceRole(id: string, role: Role): Promise<void>;
  /** Role change executed with the caller's own JWT (set_user_role RPC, atomic in SQL). */
  setRoleAsCaller(id: string, role: Role): Promise<void>;
  deleteOrphanOrganization(ownerId: string, keepOrgId: string): Promise<void>;
  resetPassword(id: string, password: string): Promise<void>;
}

export class AdminFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

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
  const t = field === 'password' ? v : v.trim();
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
function password(v: unknown, field = 'password') {
  // 72 = bcrypt input limit used by the auth service.
  return str(v, field, 8, 72);
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

  let newId: string;
  try {
    newId = await repo.createAuthUser({ email, password: pwd, name });
  } catch (e) {
    const msg = String((e as Error)?.message ?? '');
    if (/already|registered|exists/i.test(msg)) throw new AdminFailure(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado.');
    throw e;
  }
  // Fail-closed ordering: the account is banned until every step succeeds; unban is the last write.
  try {
    await repo.setBan(newId, true);
    const rows = await repo.updateProfile(newId, { organization_id: caller.organizationId, role: r, name, ativo: true });
    if (rows !== 1) throw new Error('PROFILE_NOT_UPDATED');
    await repo.replaceRole(newId, r);
    const check = canonicalRole(await repo.getProfile(newId), await repo.getRoles(newId));
    if (check !== r) throw new Error('PROVISIONING_NOT_VERIFIED');
    await repo.deleteOrphanOrganization(newId, caller.organizationId);
    await repo.setBan(newId, false);
  } catch {
    let removed = false;
    try { await repo.deleteAuthUser(newId); removed = true; } catch { /* account stays banned */ }
    throw new AdminFailure(500, removed ? 'PROVISIONING_FAILED' : 'PROVISIONING_INCOMPLETE',
      removed ? 'Falha ao criar o usuário. Nada foi mantido; tente novamente.'
              : 'Falha ao criar o usuário. A conta ficou bloqueada e precisa de revisão.');
  }
  return { user: { id: newId, name, role: r } };
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
      await repo.resetPassword(targetId, pwd);
      break;
    case 'toggle_active':
      if (f.active === false) {
        // Block login first; if the profile write fails the account remains blocked (fail-closed).
        await repo.setBan(targetId, true);
        if (await repo.updateProfile(targetId, { ativo: false }) !== 1) throw new AdminFailure(500, 'DEACTIVATION_INCOMPLETE', 'Acesso bloqueado, mas o cadastro não foi atualizado. Tente novamente.');
      } else {
        // Reactivation only for a profile whose role data is consistent; unban is the last write.
        const roles = await repo.getRoles(targetId);
        if (roles.length !== 1 || target.role !== roles[0] || !(ROLES as readonly string[]).includes(roles[0])) {
          throw new AdminFailure(409, 'ROLE_NOT_VERIFIED', 'Papel do usuário inconsistente; corrija o papel antes de reativar.');
        }
        if (await repo.updateProfile(targetId, { ativo: true }) !== 1) throw new AdminFailure(500, 'REACTIVATION_FAILED', 'Não foi possível reativar o usuário.');
        try {
          await repo.setBan(targetId, false);
        } catch {
          try { await repo.updateProfile(targetId, { ativo: false }); } catch { /* still banned: no access */ }
          throw new AdminFailure(500, 'REACTIVATION_FAILED', 'Não foi possível liberar o acesso. O usuário continua bloqueado.');
        }
      }
      break;
    case 'delete':
      await repo.deleteAuthUser(targetId);
      break;
    case 'set_role':
      await repo.setRoleAsCaller(targetId, newRole!);
      if (canonicalRole({ ...(await repo.getProfile(targetId))!, ativo: true }, await repo.getRoles(targetId)) !== newRole) {
        throw new AdminFailure(500, 'ROLE_CHANGE_NOT_VERIFIED', 'A troca de papel não foi confirmada.');
      }
      break;
    case 'update_profile':
      if (await repo.updateProfile(targetId, { name: newName }) !== 1) throw new AdminFailure(500, 'UPDATE_FAILED', 'Não foi possível salvar.');
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
      return json({ code: 'SERVICE_UNAVAILABLE', error: 'Serviço indisponível. Nenhuma alteração foi confirmada.' }, 503);
    }
  };
}
