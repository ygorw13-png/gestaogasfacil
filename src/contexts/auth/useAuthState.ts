
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
    
    // Log authentication state change
    if (session?.user) {
      logger.debug("Authentication state changed", { module: 'auth', user: session.user.id });
    } else {
      logger.debug("Authentication state changed to logged out", { module: 'auth' });
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
            // Log the error but don't block the user from proceeding
            logger.error('Error fetching user profile', { module: 'auth', user: session.user.id }, err);
            
            // Don't set error state to prevent blocking the authentication flow
            // Instead, we'll assume this is a new user and they can continue without profile data
            // The profile will be created later or can be retried on subsequent logins
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
      logger.debug("Authentication state reset", { module: 'auth', user: currentUserId });
    }
  };

  // Initialize authentication and setup listener
  useEffect(() => {
    logger.info("Checking current session...", { module: 'auth' });
    setLoading(true);
    
    // Set up listener for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug("Authentication state changed:", { module: 'auth' }, { event, userId: session?.user?.id });
      handleAuthStateChange(session);
    });

    // Check if a session already exists
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error("Error getting session:", { module: 'auth' }, error);
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
