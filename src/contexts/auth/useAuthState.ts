
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from './services';
import { logger } from '@/utils/logger';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    owner_id: string;
  } | null>(null);

  // Function to handle auth state changes
  const handleAuthStateChange = (session: Session | null) => {
    setSession(session);
    setUser(session?.user || null);
    setLoading(false);
    
    // Log de alteração de estado de autenticação
    if (session?.user) {
      logger.debug("Estado de autenticação alterado", { module: 'auth', user: session.user.id });
    } else {
      logger.debug("Estado de autenticação alterado para deslogado", { module: 'auth' });
    }
    
    // If there's a user, fetch their profile
    if (session?.user) {
      // Use setTimeout to avoid deadlock with Supabase
      setTimeout(() => {
        fetchUserProfile(session.user.id)
          .then(organizations => {
            if (organizations) setOrganization(organizations);
          })
          .catch(err => {
            logger.error('Erro ao buscar perfil de usuário', { module: 'auth', user: session.user.id }, err);
            setError(err instanceof Error ? err : new Error('Error fetching user profile'));
          });
      }, 0);
    }
  };

  // Reset authentication state
  const resetAuthState = () => {
    const currentUserId = user?.id;
    
    setUser(null);
    setSession(null);
    setOrganization(null);
    setError(null);
    
    if (currentUserId) {
      logger.debug("Estado de autenticação resetado", { module: 'auth', user: currentUserId });
    }
  };

  // Initialize authentication and setup listener
  useEffect(() => {
    logger.info("Verificando sessão atual...", { module: 'auth' });
    setLoading(true);
    
    // Set up listener for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug("Estado de autenticação alterado:", { module: 'auth' }, { event, userId: session?.user?.id });
      handleAuthStateChange(session);
    });

    // Check if a session already exists
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error("Erro ao obter sessão:", { module: 'auth' }, error);
        setError(error);
        setLoading(false);
        return;
      }
      
      handleAuthStateChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add inactivity check for automatic logout
  useEffect(() => {
    if (!session) return;

    let inactivityTimer: number | undefined;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      // Logout after 30 minutes of inactivity
      inactivityTimer = window.setTimeout(() => {
        logger.auth.sessionExpired(session.user.id);
        resetAuthState();
      }, 30 * 60 * 1000); // 30 minutes
    };
    
    // Events to reset the inactivity timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Start the timer and add listeners
    resetInactivityTimer();
    events.forEach(event => document.addEventListener(event, resetInactivityTimer));
    
    return () => {
      // Clear the timer and remove listeners when component unmounts
      if (inactivityTimer) clearTimeout(inactivityTimer);
      events.forEach(event => document.removeEventListener(event, resetInactivityTimer));
    };
  }, [session]);

  return {
    user,
    session,
    loading,
    error,
    setError,
    organization,
    resetAuthState
  };
}
