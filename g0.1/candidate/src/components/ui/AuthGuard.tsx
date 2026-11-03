import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './button';
export const AuthGuard: React.FC<{children:React.ReactNode;redirectTo?:string}> = ({children,redirectTo='/login'}) => {
  const {user,session,loading,error,permissions,refresh,signOut}=useAuth();
  const location=useLocation();
  if (loading) return <LoadingSpinner message="Verificando acesso..." />;
  if (error || (user && !permissions.ready)) return <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
    <p>{error?.message ?? 'Seu acesso precisa de revisão administrativa.'}</p>
    <Button onClick={()=>void refresh()}>Tentar novamente</Button>
    <Button variant="outline" onClick={()=>void signOut()}>Sair</Button>
  </div>;
  if (!user || !session || !permissions.ready || permissions.error) return <Navigate to={redirectTo} replace state={{from:location}} />;
  return <>{children}</>;
};