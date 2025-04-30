
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string, options?: { csrfToken?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  organization: { id: string; name: string; owner_id: string } | null;
  hasRole: (roles: string | string[]) => boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
