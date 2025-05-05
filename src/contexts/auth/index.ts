
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
  hasUserRole,
  getUserRole
} from './services/userProfile';

import {
  resetPassword as resetPasswordService
} from './authService';

// Export services with explicit naming
export {
  signInWithEmail,
  signOut,
  getCurrentSession,
  fetchUserProfile,
  hasUserRole,
  getUserRole
};

// Export renamed functions to avoid conflicts
export const resetPassword = resetPasswordService;

// Explicitly import and export the signUpWithEmail function from authService
import { signUpWithEmail as signUpWithEmailFromAuthService } from './authService';
export const signUpWithEmail = signUpWithEmailFromAuthService;
