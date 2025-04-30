
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  organization: { id: string; name: string; owner_id: string } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signIn: async () => ({ success: false, error: 'Context não inicializado' }),
  signOut: async () => {},
  refresh: async () => {},
  organization: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    owner_id: string;
  } | null>(null);

  // Função para limpar o estado da autenticação
  const resetAuthState = () => {
    setUser(null);
    setSession(null);
    setOrganization(null);
    setError(null);
  };

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get_user_profile', {
        body: { user_id: userId },
      });

      if (error) throw error;

      if (data?.organizations) {
        setOrganization(data.organizations);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setError(err instanceof Error ? err : new Error('Erro ao buscar informações do usuário'));
    }
  };

  // Função para atualizar o estado da autenticação
  const handleAuthStateChange = (session: Session | null) => {
    setSession(session);
    setUser(session?.user || null);
    setLoading(false);
    
    // Se há um usuário, buscar perfil
    if (session?.user) {
      // Usar setTimeout para evitar deadlock com Supabase
      setTimeout(() => {
        fetchUserProfile(session.user.id);
      }, 0);
    }
  };

  // Inicializar autenticação e configurar listener
  useEffect(() => {
    console.log("Verificando sessão atual...");
    setLoading(true);
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Estado de autenticação alterado:", event, session?.user?.id);
      handleAuthStateChange(session);
    });

    // Verificar se já existe uma sessão
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao obter sessão:", error);
        setError(error);
        setLoading(false);
        return;
      }
      
      handleAuthStateChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para login
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError(err instanceof Error ? err : new Error('Erro ao fazer login'));
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao fazer login' 
      };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      resetAuthState(); // Limpar o estado ao fazer logout
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      setError(err instanceof Error ? err : new Error('Erro ao fazer logout'));
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar o estado de autenticação
  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar sessão atual
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      handleAuthStateChange(data.session);
    } catch (err) {
      console.error("Erro ao atualizar autenticação:", err);
      setError(err instanceof Error ? err : new Error('Erro ao atualizar autenticação'));
    } finally {
      setLoading(false);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
