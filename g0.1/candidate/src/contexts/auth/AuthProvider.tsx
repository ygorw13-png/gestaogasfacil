import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import { AuthProviderProps } from './types';
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
    queries.clear(); clearCachedUser();
    return state.signIn(email,password,options);
  };
  const signOut=async()=> {
    queries.clear(); clearCachedUser();
    await state.signOut();
  };
  return <AuthContext.Provider value={{
    user:state.user,session:state.session,loading:state.loading,error:state.error,
    profile:state.profile,permissions:state.permissions,organization:state.organization,
    signIn,signOut,refresh:state.refresh,
    hasRole:roles=>canUseRole(state.permissions,roles),
    getUserCurrentRole:()=>verifiedRole(state.permissions),
  }}>{children}</AuthContext.Provider>;
};