import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from './services/userProfile';
import type { VerificationState } from './verificationState';
import { createSessionCoordinator } from './sessionCoordinator';
import { signInWithEmail, signOut } from './services/authentication';

export function useAuthState() {
  const [state,setState]=useState<VerificationState>({session:null,profile:null,loading:true,error:null,ready:false});
  const controller=useMemo(()=>createSessionCoordinator({
    getSession:()=>supabase.auth.getSession(),signIn:signInWithEmail,signOut,
  },fetchUserProfile,setState),[]);
  useEffect(()=> {
    controller.start();
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>controller.event(event,session));
    void controller.initialize();
    return ()=> { subscription.unsubscribe();controller.stop(); };
  },[controller]);
  return {
    user:state.session?.user ?? null, session:state.session, loading:state.loading,
    error:state.error, setError:(error:Error|null)=>setState(s=>({...s,error})),
    organization:state.profile?.organizations ?? null, profile:state.profile,
    permissions:{ready:state.ready,error:!!state.error,roles:state.profile?.roles ?? []},
    offlineMode:false, resetAuthState:controller.reset,
    refresh:async()=>{await controller.refresh();},
    signIn:controller.signIn, signOut:async()=>{await controller.signOut();},
  };
}