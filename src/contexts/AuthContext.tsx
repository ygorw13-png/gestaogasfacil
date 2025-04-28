
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type UserType = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
};

type AuthContextType = {
  user: UserType | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserPermissions: (role: UserType['role']) => void;
  updateUserData: (userData: UserType) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Primeiro configurar o listener de alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          setUser({
            id: currentSession.user.id,
            name: currentSession.user.email?.split('@')[0] || 'Usuário',
            role: 'admin' // Ajuste conforme necessário
          });
        } else {
          setUser(null);
        }
      }
    );

    // Depois verificar se já existe uma sessão
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setUser({
          id: currentSession.user.id,
          name: currentSession.user.email?.split('@')[0] || 'Usuário',
          role: 'admin' // Ajuste conforme necessário
        });
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (data.user) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const updateUserPermissions = (role: UserType['role']) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const updateUserData = (userData: UserType) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      login, 
      logout, 
      updateUserPermissions,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
