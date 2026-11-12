
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const invokeProfile = (userId: string) =>
  supabase.functions.invoke('get_user_profile', { body: { user_id: userId } });

const isAuthRequired = (error: unknown) =>
  (error as { context?: { status?: number } } | null)?.context?.status === 401;

// Fetch user profile from the server
export const fetchUserProfile = async (userId: string) => {
  try {
    let { data, error } = await invokeProfile(userId);

    // Sessão encerrada no servidor (ex.: saída em outro aparelho): tenta renovar uma vez;
    // se não houver sessão válida, encerra só neste aparelho e volta ao login.
    if (error && isAuthRequired(error)) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error('Sessão encerrada. Entre novamente.');
      }
      ({ data, error } = await invokeProfile(userId));
    }

    if (error) throw error;
    
    return data?.organizations || null;
  } catch (err) {
    logger.error('Erro ao buscar perfil de usuário', { module: 'auth', user: userId }, err);
    throw err instanceof Error ? err : new Error('Erro ao buscar informações do usuário');
  }
};
