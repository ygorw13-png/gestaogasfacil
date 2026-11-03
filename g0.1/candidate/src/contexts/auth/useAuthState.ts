import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from './services/userProfile';
import { createVerificationController, type VerificationState } from './verificationState';

export function useAuthState() {
  const [state,setState]=useState<VerificationState>({session:null,profile:null,loading:true,error:null,ready:false});
  const controller=useMemo(()=>createVerificationController(fetchUserProfile,setState),[]);
  const refresh=useCallback(async()=> {
    if (controller.session) { await controller.change(controller.session); return; }
    try {
      const {data,error}=await supabase.auth.getSession();
      if (error) controller.fail(error); else await controller.change(data.session);
    } catch { controller.fail(new Error('Sessão indisponível.')); }
  },[controller]);
  useEffect(()=> {
    let stopped=false;
    let receivedEvent=false;
    const timers=new Set<ReturnType<typeof setTimeout>>();
    const watchdog=setTimeout(()=> {
      if (!stopped && !receivedEvent) {
        receivedEvent=true;
        controller.fail(new Error('Não foi possível verificar a sessão. Tente novamente.'));
      }
    },10000);
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=> {
      receivedEvent=true;
      clearTimeout(watchdog);
      // Clear authorization synchronously, but defer network requests outside auth callback.
      controller.pending();
      const timer=setTimeout(()=> { timers.delete(timer); if (!stopped) void controller.change(session); },0);
      // Supersede all queued events before scheduling the newest one.
      for (const old of timers) clearTimeout(old);
      timers.clear(); timers.add(timer);
    });
    supabase.auth.getSession().then(({data,error})=> {
      if (stopped || receivedEvent) return;
      receivedEvent=true; clearTimeout(watchdog);
      if (error) controller.fail(error); else void controller.change(data.session);
    }).catch(()=> { if (!stopped && !receivedEvent) controller.fail(new Error('Sessão indisponível.')); });
    return ()=> { stopped=true; clearTimeout(watchdog); timers.forEach(clearTimeout); subscription.unsubscribe(); void controller.change(null); };
  },[controller]);
  return {
    user:state.session?.user ?? null, session:state.session, loading:state.loading,
    error:state.error, setError:(error:Error|null)=>setState(s=>({...s,error})),
    organization:state.profile?.organizations ?? null, profile:state.profile,
    permissions:{ready:state.ready,error:!!state.error,roles:state.profile?.roles ?? []},
    offlineMode:false, resetAuthState:()=>{void controller.change(null);}, refresh,
    verifySession:controller.change,
  };
}