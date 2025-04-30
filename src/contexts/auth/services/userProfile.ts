
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Fetch user profile from the server
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('get_user_profile', {
      body: { user_id: userId },
    });

    if (error) throw error;
    
    return data?.organizations || null;
  } catch (err) {
    logger.error('Erro ao buscar perfil de usuário', { module: 'auth', user: userId }, err);
    throw err instanceof Error ? err : new Error('Erro ao buscar informações do usuário');
  }
};
