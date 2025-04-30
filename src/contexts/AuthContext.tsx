
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/userTypes';
import { Organization } from '@/types/supabaseTypes';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  updateUserData: (userData: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  loading: true,
  updateUserData: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escutar mudanças na autenticação primeiro (importante para a ordem!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Buscar perfil do usuário usando a função RPC
        try {
          const { data, error } = await supabase.functions.invoke('get_user_profile', {
            body: { user_id: session.user.id }
          });
          
          if (error) {
            console.error('Erro ao buscar perfil:', error);
            setLoading(false);
            return;
          }
          
          if (data) {
            setUser({
              id: session.user.id,
              name: data.name || session.user.user_metadata?.name || 'Usuário',
              role: data.role as UserRole
            });

            if (data.organizations) {
              setOrganization(data.organizations);
            }
          }
        } catch (error) {
          console.error('Erro ao processar autenticação:', error);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    // Depois verificar sessão atual
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Buscar perfil do usuário usando a função RPC
          const { data, error } = await supabase.functions.invoke('get_user_profile', {
            body: { user_id: session.user.id }
          });

          if (error) {
            console.error('Erro ao buscar perfil:', error);
            setLoading(false);
            return;
          }
          
          if (data) {
            setUser({
              id: session.user.id,
              name: data.name || session.user.user_metadata?.name || 'Usuário',
              role: data.role as UserRole
            });

            if (data.organizations) {
              setOrganization(data.organizations);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUserData = (userData: User) => {
    setUser(userData);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, updateUserData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
