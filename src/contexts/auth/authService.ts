
import { supabase } from '@/integrations/supabase/client';
import { validatePasswordStrength } from '@/utils/securityUtils';

// Reset password functionality
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

// Register a new user with email
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
