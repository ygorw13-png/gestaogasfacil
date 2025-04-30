
import React from 'react';
import { AuthContext } from './AuthContext';
import { AuthProviderProps } from './types';
import { signInWithEmail, signOut as authSignOut, getCurrentSession, hasUserRole } from './authService';
import { useAuthState } from './useAuthState';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    user, 
    session, 
    loading, 
    error, 
    setError, 
    organization, 
    resetAuthState
  } = useAuthState();

  // Function to check if the user has a specific role
  const hasRole = (roles: string | string[]) => {
    return hasUserRole(user, roles);
  };

  // Function for login
  const signIn = async (email: string, password: string, options?: { csrfToken?: string }) => {
    try {
      setError(null);
      return await signInWithEmail(email, password, options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error signing in'));
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error signing in' 
      };
    }
  };

  // Function for logout
  const signOut = async () => {
    try {
      setError(null);
      await authSignOut();
      resetAuthState(); // Clear the state when logging out
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err instanceof Error ? err : new Error('Error signing out'));
    }
  };

  // Function to update authentication state
  const refresh = async () => {
    try {
      setError(null);
      
      // Get current session
      const session = await getCurrentSession();
      // The session update will be handled by the auth state change listener
    } catch (err) {
      console.error("Error refreshing authentication:", err);
      setError(err instanceof Error ? err : new Error('Error refreshing authentication'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signOut,
        refresh,
        organization,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
