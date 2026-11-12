import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const refreshSession = vi.fn();
const signOut = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) }, auth: { refreshSession: () => refreshSession(), signOut: (o: unknown) => signOut(o) } },
}));
vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn() } }));

import { fetchUserProfile } from './userProfile';

const org = { id: 'o1', name: 'Org', owner_id: 'u1' };
const unauthorized = { data: null, error: { context: { status: 401 } } };

describe('fetchUserProfile com sessão revogada', () => {
  beforeEach(() => { invoke.mockReset(); refreshSession.mockReset(); signOut.mockReset(); });

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
});
