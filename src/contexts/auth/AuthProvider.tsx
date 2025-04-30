
import React, { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './AuthContext';
import { AuthProviderProps } from './types';
import { fetchUserProfile, signInWithEmail, signOut as authSignOut, 
         getCurrentSession, hasUserRole } from './authService';

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

  // Função para verificar se o usuário tem um determinado papel
  const hasRole = (roles: string | string[]) => {
    return hasUserRole(user, roles);
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
        fetchUserProfile(session.user.id)
          .then(organizations => {
            if (organizations) setOrganization(organizations);
          })
          .catch(err => {
            console.error('Error fetching profile:', err);
            setError(err instanceof Error ? err : new Error('Error fetching user profile'));
          });
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

  // Adicionar verificação de inatividade para logout automático
  useEffect(() => {
    if (!session) return;

    let inactivityTimer: number | undefined;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      // Fazer logout após 30 minutos de inatividade
      inactivityTimer = window.setTimeout(() => {
        console.log("Sessão expirada por inatividade");
        signOut();
      }, 30 * 60 * 1000); // 30 minutos
    };
    
    // Eventos para resetar o timer de inatividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Iniciar o timer e adicionar listeners
    resetInactivityTimer();
    events.forEach(event => document.addEventListener(event, resetInactivityTimer));
    
    return () => {
      // Limpar o timer e remover listeners quando o componente é desmontado
      if (inactivityTimer) clearTimeout(inactivityTimer);
      events.forEach(event => document.removeEventListener(event, resetInactivityTimer));
    };
  }, [session]);

  // Função para login
  const signIn = async (email: string, password: string, options?: { csrfToken?: string }) => {
    try {
      setError(null);
      return await signInWithEmail(email, password, options);
    } catch (err) {
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
      await authSignOut();
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
      const session = await getCurrentSession();
      handleAuthStateChange(session);
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
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
