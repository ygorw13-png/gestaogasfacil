
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from './services';
import { logger } from '@/utils/logger';
import { getCachedUser, saveCachedUser } from '@/lib/offline/userCache';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
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
    if (session?.user) setOfflineMode(false);

    // Log authentication state change
    if (session?.user) {
      logger.debug("Authentication state changed", { module: 'auth', user: session.user.id });
    } else {
      logger.debug("Authentication state changed to logged out", { module: 'auth' });
    }
    
    // If there's a user, fetch their profile
    if (session?.user) {
      const u = session.user;
      // Cache mínimo para permitir acesso básico sem internet
      saveCachedUser({
        id: u.id,
        email: u.email ?? null,
        name: (u.user_metadata?.name as string) ?? null,
        role: null,
        cachedAt: Date.now(),
      });
      // Use setTimeout to avoid deadlock with Supabase
      setTimeout(() => {
        fetchUserProfile(u.id)
          .then(organizations => {
            if (organizations) setOrganization(organizations);
          })
          .catch(err => {
            // Log the error but don't block the user from proceeding
            logger.error('Error fetching user profile', { module: 'auth', user: u.id }, err);
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
    setOfflineMode(false);
    
    if (currentUserId) {
      logger.debug("Authentication state reset", { module: 'auth', user: currentUserId });
    }
  };

  // Initialize authentication and setup listener
  useEffect(() => {
    logger.info("Checking current session...", { module: 'auth' });
    setLoading(true);
    let settled = false;

    // Sem rede (ou rede travada): libera o app com o usuário salvo no aparelho
    const fallbackToCache = () => {
      if (settled) return;
      const cached = getCachedUser();
      if (cached) {
        settled = true;
        setOfflineMode(true);
        setUser({ id: cached.id, email: cached.email ?? undefined } as unknown as User);
        setLoading(false);
        logger.info('Acesso offline com usuário em cache', { module: 'auth' });
      } else {
        settled = true;
        setLoading(false);
      }
    };

    // Nunca deixa a tela travada esperando a rede
    const watchdog = window.setTimeout(fallbackToCache, 6000);
    
    // Set up listener for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug("Authentication state changed:", { module: 'auth' }, { event, userId: session?.user?.id });
      if (session) settled = true;
      handleAuthStateChange(session);
    });

    // Check if a session already exists
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error("Error getting session:", { module: 'auth' }, error);
        if (getCachedUser()) {
          fallbackToCache();
          return;
        }
        setError(error);
        setLoading(false);
        return;
      }
      settled = true;
      handleAuthStateChange(session);
    }).catch(() => fallbackToCache());

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      window.setTimeout(fallbackToCache, 800);
    }

    return () => {
      window.clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    error,
    setError,
    organization,
    offlineMode,
    resetAuthState
  };

}
