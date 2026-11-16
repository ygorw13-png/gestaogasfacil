
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

type Organization = { id: string; name: string; owner_id: string };

const invokeProfile = (userId: string) =>
  supabase.functions.invoke('get_user_profile', { body: { user_id: userId } });

const isAuthRequired = (error: unknown) =>
  (error as { context?: { status?: number } } | null)?.context?.status === 401;

const isSessionRejected = (error: unknown) => {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
};

// Sessão já removida neste aparelho (ex.: outra chamada simultânea detectou a revogação).
const isSessionMissing = (error: unknown) =>
  (error as { name?: string } | null)?.name === 'AuthSessionMissingError';

const hasLocalSession = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session?.access_token;
};

// Renova a sessão; se o servidor não a aceita mais, encerra só neste aparelho (volta ao login).
const renewOrSignOut = async () => {
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Sessão encerrada. Entre novamente.');
  }
};

const loadProfile = async (userId: string): Promise<Organization | null> => {
  // Sem sessão neste aparelho não há perfil a buscar: nunca chamar a função sem token do usuário.
  if (!(await hasLocalSession())) return null;

  // Sessão encerrada no servidor (ex.: saída em outro aparelho) é detectada antes de chamar
  // a função de perfil. Falha de rede não encerra a sessão (modo offline continua).
  const { error: userError } = await supabase.auth.getUser();
  if (userError && isSessionRejected(userError)) await renewOrSignOut();
  if ((userError && isSessionMissing(userError)) || !(await hasLocalSession())) return null;

  let { data, error } = await invokeProfile(userId);
  if (error && isAuthRequired(error)) {
    await renewOrSignOut();
    ({ data, error } = await invokeProfile(userId));
  }

  if (error) throw error;
  return data?.organizations || null;
};

// Chamadas simultâneas para o mesmo usuário (evento de login + sessão inicial) compartilham o resultado.
const inFlight = new Map<string, Promise<Organization | null>>();

// Fetch user profile from the server
export const fetchUserProfile = (userId: string): Promise<Organization | null> => {
  const pending = inFlight.get(userId);
  if (pending) return pending;
  const run = loadProfile(userId)
    .catch((err) => {
      logger.error('Erro ao buscar perfil de usuário', { module: 'auth', user: userId }, err);
      throw err instanceof Error ? err : new Error('Erro ao buscar informações do usuário');
    })
    .finally(() => inFlight.delete(userId));
  inFlight.set(userId, run);
  return run;
};
