import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import { AuthProviderProps } from './types';
import { supabase } from '@/integrations/supabase/client';
import { signInWithEmail, signOut as authSignOut } from './services/authentication';
import { canUseRole, verifiedRole } from './services/permissions';
import { clearCachedUser } from '@/lib/offline/userCache';
import { useAuthState } from './useAuthState';

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const state=useAuthState();
  const queries=useQueryClient();
  const previous=React.useRef<string|null>(null);
  React.useEffect(()=> {
    const id=state.user?.id ?? null;
    if (previous.current!==id) { queries.clear(); clearCachedUser(); previous.current=id; }
  },[state.user?.id,queries]);
  const signIn=async(email:string,password:string,options?:{csrfToken?:string}) => {
    state.resetAuthState(); queries.clear(); clearCachedUser();
    const result=await signInWithEmail(email,password,options);
    if (!result.success) return result;
    const {data,error}=await supabase.auth.getSession();
    if (error || !data.session) return {success:false,error:'Não foi possível verificar sua sessão.'};
    const verified=await state.verifySession(data.session);
    return verified ? {success:true} : {success:false,error:'Seu acesso não foi verificado. Tente novamente ou solicite revisão administrativa.'};
  };
  const signOut=async()=> {
    state.resetAuthState(); queries.clear(); clearCachedUser();
    try { await authSignOut(); }
    catch { state.setError(new Error('Não foi possível encerrar a sessão no servidor. O acesso local permanece bloqueado.')); }
  };
  return <AuthContext.Provider value={{
    user:state.user,session:state.session,loading:state.loading,error:state.error,
    profile:state.profile,permissions:state.permissions,organization:state.organization,
    signIn,signOut,refresh:state.refresh,
    hasRole:roles=>canUseRole(state.permissions,roles),
    getUserCurrentRole:()=>verifiedRole(state.permissions),
  }}>{children}</AuthContext.Provider>;
};