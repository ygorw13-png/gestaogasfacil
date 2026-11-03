import {it,expect,vi} from 'vitest';
import type {Session} from '@supabase/supabase-js';
import {createSessionCoordinator} from '../candidate/src/contexts/auth/sessionCoordinator';
import type {VerificationState} from '../candidate/src/contexts/auth/verificationState';
import type {VerifiedProfile} from '../candidate/src/contexts/auth/services/userProfile';
const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002';
const session=(id:string)=>({user:{id},access_token:`fixture-${id}`} as Session);
const profile=(id:string)=>({id,ativo:true,name:'Teste',role:'entregador',roles:['entregador'],organization_id:id,organizations:{id,name:'Empresa Teste',owner_id:id}} as VerifiedProfile);
function deferred<T>(){let resolve:(v:T)=>void=()=>{};const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};}
const response=(id:string)=>({data:{session:session(id)},error:null});
function setup(){const states:VerificationState[]=[];const services={getSession:vi.fn(),signIn:vi.fn(),signOut:vi.fn(async()=>{})};const read=vi.fn(async(id:string)=>profile(id));const c=createSessionCoordinator(services,read,s=>states.push(s));return {c,services,states,read,last:()=>states.at(-1)};}
it('refresh A pending then login B: late getSession A cannot restore A; form succeeds',async()=>{
 const {c,services,last}=setup();services.getSession.mockResolvedValueOnce(response(A));await c.initialize();
 const late=deferred<ReturnType<typeof response>>();services.getSession.mockReturnValueOnce(late.promise);const refresh=c.refresh();
 services.signIn.mockResolvedValue({success:true});services.getSession.mockResolvedValueOnce(response(B));
 const result=await c.signIn('b@example.invalid','fixture');expect(result).toEqual({success:true});
 late.resolve(response(A));expect(await refresh).toBe(false);expect(last()?.session?.user.id).toBe(B);expect(last()?.profile?.organization_id).toBe(B);expect(last()?.ready).toBe(true);
});
it('refresh A pending then logout: neither identity nor permissions return',async()=>{
 const {c,services,last}=setup();services.getSession.mockResolvedValueOnce(response(A));await c.initialize();const late=deferred<ReturnType<typeof response>>();services.getSession.mockReturnValueOnce(late.promise);const refresh=c.refresh();
 expect(await c.signOut()).toEqual({success:true});late.resolve(response(A));expect(await refresh).toBe(false);expect(last()?.session).toBeNull();expect(last()?.profile).toBeNull();expect(last()?.ready).toBe(false);
});
it.each(['event-first','manual-first'])('SIGNED_IN/manual verification coordinated %s; form succeeds and only one lookup',async(order)=>{
 const {c,services,last,read}=setup();const login=deferred<{success:boolean}>();services.signIn.mockReturnValue(login.promise);services.getSession.mockResolvedValue(response(B));const form=c.signIn('b@example.invalid','fixture');
 if(order==='event-first'){c.event('SIGNED_IN',session(B));await Promise.resolve();await Promise.resolve();login.resolve({success:true});}
 else{login.resolve({success:true});await Promise.resolve();await Promise.resolve();c.event('SIGNED_IN',session(B));}
 expect(await form).toEqual({success:true});await Promise.resolve();expect(read).toHaveBeenCalledTimes(1);expect(last()?.ready).toBe(true);expect(last()?.profile?.id).toBe(B);
});
it('logout network error plus token refresh cannot authorize; fresh explicit login succeeds',async()=>{
 const {c,services,last}=setup();services.getSession.mockResolvedValue(response(A));await c.initialize();services.signOut.mockRejectedValue(new Error('network'));
 expect(await c.signOut()).toEqual({success:false});c.event('TOKEN_REFRESHED',session(A));await Promise.resolve();expect(await c.refresh()).toBe(false);expect(last()?.session).toBeNull();expect(last()?.ready).toBe(false);
 services.signIn.mockResolvedValue({success:true});services.getSession.mockResolvedValue(response(B));expect(await c.signIn('b@example.invalid','fixture')).toEqual({success:true});expect(last()?.profile?.id).toBe(B);
});
it('logout while manual getSession pending returns failure to form and remains blocked',async()=>{
 const {c,services,last}=setup();const late=deferred<ReturnType<typeof response>>();services.signIn.mockResolvedValue({success:true});services.getSession.mockReturnValue(late.promise);const login=c.signIn('a@example.invalid','fixture');await Promise.resolve();await c.signOut();late.resolve(response(A));expect((await login).success).toBe(false);expect(last()?.ready).toBe(false);expect(last()?.session).toBeNull();
});