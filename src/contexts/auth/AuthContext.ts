
import { createContext } from 'react';
import { AuthContextType } from './types';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => ({ success: false, error: 'Context não inicializado' }),
  signOut: async () => {},
  refresh: async () => {},
  organization: null,
  hasRole: () => false,
  getUserCurrentRole: () => 'anonymous',
});
