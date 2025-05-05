
// Export individual items to avoid namespace collisions
export { AuthContext } from './AuthContext';
export { AuthProvider } from './AuthProvider';
export * from './types';
export { useAuth } from './hooks';

// Import and re-export specific functions from services to avoid conflicts
import { 
  signInWithEmail,
  signOut,
  getCurrentSession
} from './services/authentication';

import {
  fetchUserProfile,
} from './services/userProfile';

import {
  hasUserRole,
  getUserRole
} from './services/permissions';

// Export services with explicit naming
export {
  signInWithEmail,
  signOut,
  getCurrentSession,
  fetchUserProfile,
  hasUserRole,
  getUserRole
};

// Create and export the authService functions
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error resetting password' 
    };
  }
};

// Import supabase client for the functions above
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/utils/securityUtils';

// Export signUpWithEmail function directly
export const signUpWithEmail = async (email: string, password: string, userData?: { name?: string }) => {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message };
    }
    
    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Register user
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, user: data.user };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error registering user' 
    };
  }
};
