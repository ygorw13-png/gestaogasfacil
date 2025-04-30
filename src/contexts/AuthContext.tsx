
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
    // Configurar o listener de alterações no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
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
        } catch (error) {
          console.error('Erro ao processar autenticação:', error);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        setUser(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    // Verificar se já existe uma sessão ativa
    const checkCurrentSession = async () => {
      try {
        console.log("Checking current session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Found existing session:", session.user.id);
          
          // Buscar perfil do usuário
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
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCurrentSession();
    
    // Limpar o subscription ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUserData = (userData: User) => {
    setUser(userData);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setOrganization(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
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
