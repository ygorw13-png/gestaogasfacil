import React from 'react';
import { beforeEach,afterEach,it,expect,vi } from 'vitest';
import { renderHook,act,render,screen,cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthState } from '../candidate/src/contexts/auth/useAuthState';
import { useRegisterForm } from '../candidate/src/hooks/useRegisterForm';
import { AuthGuard } from '../candidate/src/components/ui/AuthGuard';
import { AuthContext } from '../candidate/src/contexts/auth/AuthContext';
import type { Session } from '@supabase/supabase-js';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),read:vi.fn(),signup:vi.fn(),toast:vi.fn(),listener:null as null|((e:string,s:Session|null)=>void)}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getSession:mocks.getSession,onAuthStateChange:(cb:typeof mocks.listener)=>{mocks.listener=cb;return {data:{subscription:{unsubscribe:vi.fn()}}};}}}}));
vi.mock('../candidate/src/contexts/auth/services/userProfile',()=>({fetchUserProfile:mocks.read}));
vi.mock('@/contexts/auth',async()=>{const {AuthContext}=await import('../candidate/src/contexts/auth/AuthContext');return {useAuth:()=>React.useContext(AuthContext),signUpWithEmail:mocks.signup};});
vi.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:mocks.toast})}));
vi.mock('@/utils/securityUtils',()=>({validatePasswordStrength:()=>({valid:true}),sanitizeHtml:(v:string)=>v}));
const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002';
const ses=(id:string)=>({user:{id}} as Session);
const p=(id:string)=>({id,ativo:true,name:'Teste',role:'entregador',roles:['entregador'],organization_id:id,organizations:{id,name:'Empresa Teste',owner_id:id}});
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();mocks.listener=null;});
afterEach(()=>{cleanup();vi.useRealTimers();});
it('initial old getSession cannot override a newer account event',async()=>{
 let resolve:(v:unknown)=>void=()=>{};mocks.getSession.mockReturnValue(new Promise(r=>resolve=r));mocks.read.mockImplementation(async(id)=>p(id));
 const {result}=renderHook(()=>useAuthState());
 act(()=>mocks.listener?.('SIGNED_IN',ses(B)));
 expect(result.current.organization).toBeNull();expect(result.current.permissions.ready).toBe(false);expect(result.current.loading).toBe(true);
 await act(async()=>{await vi.advanceTimersByTimeAsync(1);});
 expect(result.current.user?.id).toBe(B);
 await act(async()=>resolve({data:{session:ses(A)},error:null}));
 expect(result.current.organization?.id).toBe(B);expect(mocks.read).toHaveBeenCalledTimes(1);
});
it('integrated hook ignores old profile response after switch',async()=>{
 let resolveA:(v:unknown)=>void=()=>{};mocks.getSession.mockResolvedValue({data:{session:ses(A)},error:null});mocks.read.mockImplementation(id=>id===A?new Promise(r=>resolveA=r):Promise.resolve(p(B)));
 const {result}=renderHook(()=>useAuthState());await act(async()=>{});
 act(()=>mocks.listener?.('SIGNED_IN',ses(B)));
 expect(result.current.organization).toBeNull();expect(result.current.permissions.roles).toEqual([]);
 await act(async()=>{await vi.advanceTimersByTimeAsync(1);resolveA(p(A));});
 expect(result.current.organization?.id).toBe(B);expect(result.current.profile?.id).toBe(B);
});
it('unavailable verification times out visibly without offline identity',async()=>{
 mocks.getSession.mockResolvedValue({data:{session:ses(A)},error:null});mocks.read.mockReturnValue(new Promise(()=>{}));
 const {result}=renderHook(()=>useAuthState());await act(async()=>{});await act(async()=>{await vi.advanceTimersByTimeAsync(10001);});
 expect(result.current.loading).toBe(false);expect(result.current.error).toBeInstanceOf(Error);expect(result.current.organization).toBeNull();expect(result.current.permissions.ready).toBe(false);
});
it('15 signup without session never calls profile endpoints or direct inserts',async()=>{
 mocks.signup.mockResolvedValue({success:true,user:{id:A}});
 const {result}=renderHook(()=>useRegisterForm(),{wrapper:({children})=><MemoryRouter>{children}</MemoryRouter>});
 await act(async()=>{await result.current.handleRegister({name:'Cadastro Teste',email:'new@example.invalid',password:'FixtureStrong91',confirmPassword:'FixtureStrong91'});});
 expect(mocks.signup).toHaveBeenCalledTimes(1);expect(mocks.read).not.toHaveBeenCalled();expect(mocks.toast).toHaveBeenCalled();
});
it.each([true,false])('protected UI remains blocked, loading=%s',loading=>{
 const value={user:ses(A).user,session:ses(A),loading,error:loading?null:new Error('Revisão necessária'),permissions:{ready:false,error:!loading,roles:[]},profile:null,organization:null,signIn:async()=>({success:false}),signOut:async()=>{},refresh:async()=>{},hasRole:()=>false,getUserCurrentRole:()=>null};
 render(<MemoryRouter><AuthContext.Provider value={value}><AuthGuard><span>Protected result</span></AuthGuard></AuthContext.Provider></MemoryRouter>);
 expect(screen.queryByText('Protected result')).toBeNull();
});