
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/userTypes';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUserData: (userData: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUserData: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Buscar perfil do usuário usando a função RPC
          const { data, error } = await supabase.functions.invoke('get_user_profile', {
            body: { user_id: authUser.id }
          });

          if (error) {
            console.error('Erro ao buscar perfil:', error);
          } else if (data) {
            setUser({
              id: authUser.id,
              name: data.name,
              role: data.role as UserRole
            });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Buscar perfil do usuário usando a função RPC
        const { data, error } = await supabase.functions.invoke('get_user_profile', {
          body: { user_id: session.user.id }
        });
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
        } else if (data) {
          setUser({
            id: session.user.id,
            name: data.name,
            role: data.role as UserRole
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

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
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUserData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
