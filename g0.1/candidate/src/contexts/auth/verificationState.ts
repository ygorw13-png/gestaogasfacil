import type { Session } from '@supabase/supabase-js';
import type { VerifiedProfile } from './services/userProfile';
export type VerificationState = {
  session: Session | null; profile: VerifiedProfile | null;
  loading: boolean; error: Error | null; ready: boolean;
};
export function createVerificationController(read: (id:string)=>Promise<VerifiedProfile>, publish:(state:VerificationState)=>void) {
  let version=0;
  let current: Session | null=null;
  let disposed=false;
  const reset=(session:Session|null, loading:boolean, error:Error|null=null) => publish({session,profile:null,loading,error,ready:false});
  return {
    async change(session:Session|null) {
      const request=++version;
      current=session;
      if (disposed) return false;
      reset(session,!!session);
      if (!session) return false;
      try {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout=new Promise<never>((_resolve,reject)=>{
          timer=setTimeout(()=>reject(new Error('Verificação indisponível. Tente novamente.')),10000);
        });
        const profile=await Promise.race([read(session.user.id),timeout]).finally(()=>{if(timer)clearTimeout(timer);});
        if (disposed || request!==version) return false;
        if (profile.id!==session.user.id || profile.ativo!==true) throw new Error('Acesso não verificado.');
        publish({session,profile,loading:false,error:null,ready:true});
        return true;
      } catch (error) {
        if (!disposed && request===version) reset(session,false,error instanceof Error ? error : new Error('Acesso indisponível.'));
        return false;
      }
    },
    fail(error:Error) { ++version; current=null; if (!disposed) reset(null,false,error); },
    pending() { ++version; current=null; if (!disposed) reset(null,true); },
    get session() { return current; },
    dispose() { disposed=true; ++version; },
  };
}