import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const refreshSession = vi.fn();
const signOut = vi.fn();
const getUser = vi.fn();
const getSession = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) }, auth: { getSession: () => getSession(), getUser: () => getUser(), refreshSession: () => refreshSession(), signOut: (o: unknown) => signOut(o) } },
}));
vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn() } }));

import { fetchUserProfile } from './userProfile';

const org = { id: 'o1', name: 'Org', owner_id: 'u1' };
const unauthorized = { data: null, error: { context: { status: 401 } } };

describe('fetchUserProfile com sessão revogada', () => {
  beforeEach(() => { getSession.mockReset(); getSession.mockResolvedValue({ data: { session: { access_token: 't' } } }); getUser.mockReset(); getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }); invoke.mockReset(); refreshSession.mockReset(); signOut.mockReset(); });

  it('renova a sessão e repete uma vez após 401', async () => {
    invoke.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce({ data: { organizations: org }, error: null });
    refreshSession.mockResolvedValue({ data: { session: { access_token: 'novo' } }, error: null });
    await expect(fetchUserProfile('u1')).resolves.toEqual(org);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('encerra só neste aparelho quando a renovação falha', async () => {
    invoke.mockResolvedValueOnce(unauthorized);
    refreshSession.mockResolvedValue({ data: { session: null }, error: new Error('revogada') });
    await expect(fetchUserProfile('u1')).rejects.toThrow('Sessão encerrada');
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('sessão recusada pelo servidor não chama a função de perfil e volta ao login', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 403 } });
    refreshSession.mockResolvedValue({ data: { session: null }, error: new Error('revogada') });
    await expect(fetchUserProfile('u1')).rejects.toThrow('Sessão encerrada');
    expect(invoke).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('falha de rede não encerra a sessão', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 0 } });
    invoke.mockResolvedValueOnce({ data: { organizations: org }, error: null });
    await expect(fetchUserProfile('u1')).resolves.toEqual(org);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('sem sessão neste aparelho não chama a função de perfil', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(fetchUserProfile('u1')).resolves.toBeNull();
    expect(invoke).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('sessão removida por outra chamada simultânea não chama a função de perfil', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthSessionMissingError', status: 400 } });
    await expect(fetchUserProfile('u1')).resolves.toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('chamadas simultâneas compartilham uma única verificação', async () => {
    invoke.mockResolvedValue({ data: { organizations: org }, error: null });
    const [a, b] = await Promise.all([fetchUserProfile('u1'), fetchUserProfile('u1')]);
    expect(a).toEqual(org); expect(b).toEqual(org);
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});
