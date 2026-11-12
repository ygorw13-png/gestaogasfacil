
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const invokeProfile = (userId: string) =>
  supabase.functions.invoke('get_user_profile', { body: { user_id: userId } });

const isAuthRequired = (error: unknown) =>
  (error as { context?: { status?: number } } | null)?.context?.status === 401;

const isSessionRejected = (error: unknown) => {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
};

// Renova a sessão; se o servidor não a aceita mais, encerra só neste aparelho (volta ao login).
const renewOrSignOut = async () => {
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Sessão encerrada. Entre novamente.');
  }
};

// Fetch user profile from the server
export const fetchUserProfile = async (userId: string) => {
  try {
    // Sessão encerrada no servidor (ex.: saída em outro aparelho) é detectada antes de chamar
    // a função de perfil. Falha de rede não encerra a sessão (modo offline continua).
    const { error: userError } = await supabase.auth.getUser();
    if (userError && isSessionRejected(userError)) await renewOrSignOut();

    let { data, error } = await invokeProfile(userId);
    if (error && isAuthRequired(error)) {
      await renewOrSignOut();
      ({ data, error } = await invokeProfile(userId));
    }

    if (error) throw error;
    
    return data?.organizations || null;
  } catch (err) {
    logger.error('Erro ao buscar perfil de usuário', { module: 'auth', user: userId }, err);
    throw err instanceof Error ? err : new Error('Erro ao buscar informações do usuário');
  }
};
