import type { Session } from '@supabase/supabase-js';
import { createVerificationController, type VerificationState } from './verificationState';
import type { VerifiedProfile } from './services/userProfile';
type LoginResult={success:boolean;error?:string};
type Services={
  getSession:()=>Promise<{data:{session:Session|null};error:Error|null}>;
  signIn:(email:string,password:string,options?:{csrfToken?:string})=>Promise<LoginResult>;
  signOut:()=>Promise<void>;
};
export function createSessionCoordinator(services:Services,read:(id:string)=>Promise<VerifiedProfile>,publish:(s:VerificationState)=>void) {
  const verification=createVerificationController(read,publish);
  let generation=0;
  let blocked=false;
  let manualLogin=false;
  let acceptedKey:string|null=null;
  let verifiedPromise:Promise<boolean>|null=null;
  let verificationFailed=false;
  let active=true;
  const key=(session:Session)=>`${session.user.id}:${session.access_token}`;
  function invalidate(pending:boolean) {
    ++generation;acceptedKey=null;verifiedPromise=null;verificationFailed=false;
    if(pending)verification.pending();else void verification.change(null);
    return generation;
  }
  function accept(session:Session|null,ticket:number):Promise<boolean> {
    // Check the shared generation BEFORE accepting getSession identity.
    if(!active || blocked || ticket!==generation)return Promise.resolve(false);
    if(!session){acceptedKey=null;verifiedPromise=null;return verification.change(null);}
    const nextKey=key(session);
    if(nextKey===acceptedKey && verifiedPromise)return verifiedPromise;
    acceptedKey=nextKey;
    verifiedPromise=verification.change(session).then(ok=>{
      if(ticket===generation && acceptedKey===nextKey)verificationFailed=!ok;
      return ok;
    });
    return verifiedPromise;
  }
  async function readSession(ticket:number) {
    try {
      let timer:ReturnType<typeof setTimeout>|undefined;
      const timeout=new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Sessão indisponível.')),10000);});
      const {data,error}=await Promise.race([services.getSession(),timeout]).finally(()=>{if(timer)clearTimeout(timer);});
      if(!active || blocked || ticket!==generation)return false;
      if(error){verification.fail(error);return false;}
      return await accept(data.session,ticket);
    } catch {
      if(active && !blocked && ticket===generation)verification.fail(new Error('Sessão indisponível.'));
      return false;
    }
  }
  return {
    initialize:()=>readSession(generation),
    refresh:()=>{
      if(blocked)return Promise.resolve(false);
      if(verificationFailed){verifiedPromise=null;acceptedKey=null;verificationFailed=false;}
      return readSession(generation);
    },
    event(event:string,session:Session|null) {
      if(!active || blocked)return;
      if(event==='SIGNED_OUT'){manualLogin=false;invalidate(false);return;}
      const incoming=session?key(session):null;
      // A login event and manual login share one generation and verification.
      if(!manualLogin && incoming!==acceptedKey)invalidate(!!session);
      const ticket=generation;
      // Delay network work outside the Auth callback, while clearing privileges immediately.
      if(incoming!==acceptedKey)verification.pending();
      queueMicrotask(()=>{if(ticket===generation && !blocked)void accept(session,ticket);});
    },
    async signIn(email:string,password:string,options?:{csrfToken?:string}):Promise<LoginResult> {
      blocked=false;manualLogin=true;
      const ticket=invalidate(true);
      try {
        const result=await services.signIn(email,password,options);
        if(ticket!==generation || blocked || !active)return {success:false,error:'A sessão foi alterada. Entre novamente.'};
        if(!result.success){verification.fail(new Error(result.error??'Falha no login.'));return result;}
        // Event may have already verified this very login. Join that promise.
        const ok=verifiedPromise?await verifiedPromise:await readSession(ticket);
        return ok && ticket===generation && !blocked
          ? {success:true} : {success:false,error:'Seu acesso não foi verificado. Tente novamente ou solicite revisão administrativa.'};
      } catch {
        if(ticket===generation)verification.fail(new Error('Não foi possível verificar o login.'));
        return {success:false,error:'Não foi possível verificar o login.'};
      } finally {if(ticket===generation)manualLogin=false;}
    },
    async signOut() {
      // Local logout is irrevocable by refresh events, even if remote signOut fails.
      blocked=true;manualLogin=false;const ticket=invalidate(false);
      try{await services.signOut();return {success:true};}
      catch{if(ticket===generation && blocked)verification.fail(new Error('Não foi possível encerrar a sessão no servidor. O acesso local permanece bloqueado.'));return {success:false};}
    },
    reset(){blocked=true;manualLogin=false;invalidate(false);},
    stop(){active=false;invalidate(false);},
    start(){active=true;},
  };
}