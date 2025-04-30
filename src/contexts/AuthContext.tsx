
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/userTypes';
import { Organization } from '@/types/supabaseTypes';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  updateUserData: (userData: User) => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  loading: true,
  updateUserData: () => {},
  signOut: async () => {},
  signIn: async () => ({success: false})
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
            toast({
              title: 'Erro!',
              description: `Não foi possível carregar seu perfil: ${error.message}`,
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
          
          if (data) {
            console.log("Perfil de usuário carregado:", data);
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
          toast({
            title: 'Erro de autenticação',
            description: 'Ocorreu um erro ao processar sua autenticação.',
            variant: 'destructive'
          });
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
            console.log("Perfil de usuário existente carregado:", data);
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
      console.log("Iniciando logout...");
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Limpar todos os dados do usuário
      setUser(null);
      setOrganization(null);
      
      // Limpar qualquer cache de autenticação local
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso."
      });
      
      console.log("Logout concluído");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar sair da sua conta.",
        variant: "destructive"
      });
    }
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Tentando login com:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erro durante login:", error);
        return {
          success: false,
          error: error.message
        };
      }
      
      if (data && data.user) {
        console.log("Login bem-sucedido para:", data.user.id);
        return { success: true };
      }
      
      return {
        success: false,
        error: "Não foi possível realizar o login. Tente novamente."
      };
    } catch (error: any) {
      console.error("Exceção durante login:", error);
      return {
        success: false,
        error: error.message || "Ocorreu um erro durante o login."
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      organization, 
      loading, 
      updateUserData, 
      signOut,
      signIn 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
