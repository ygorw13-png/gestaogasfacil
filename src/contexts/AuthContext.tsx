
import React, { createContext, useState, useContext, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUserPermissions: (role: User['role']) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    // Implementação simplificada - no futuro, substituir por autenticação real
    if (email === 'admin@gasflow.com' && password === 'admin') {
      setUser({
        id: '1',
        name: 'Administrador',
        role: 'admin'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserPermissions = (role: User['role']) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserPermissions }}>
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
