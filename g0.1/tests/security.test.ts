import { describe,it,expect } from 'vitest';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { makeProfileHandler,Failure } from '../candidate/supabase/functions/_shared/g0-profile-core';
import { createVerificationController, type VerificationState } from '../candidate/src/contexts/auth/verificationState';
import { canUseRole,verifiedRole } from '../candidate/src/contexts/auth/services/permissions';
import type { Session } from '@supabase/supabase-js';
import type { VerifiedProfile } from '../candidate/src/contexts/auth/services/userProfile';
const A='10000000-0000-4000-8000-000000000001', B='10000000-0000-4000-8000-000000000002';
const OA='20000000-0000-4000-8000-000000000001',OB='20000000-0000-4000-8000-000000000002';
function sql(query:string) {
 return execFileSync('psql',['postgresql://g0test@127.0.0.1:55439/postgres?sslmode=disable','-X','-qAt','-v','ON_ERROR_STOP=1','-c',query],{encoding:'utf8',env:{PATH:process.env.PATH}}).trim();
}
const asUser=(id:string,query:string)=>sql(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',true); ${query}; ROLLBACK;`);
function fixture() {
 sql(`TRUNCATE public.profiles,public.user_roles,public.organizations,auth.users;
 INSERT INTO organizations(id,name,owner_id) VALUES('${OA}','Empresa A Teste','${A}'),('${OB}','Empresa B Teste','${B}');
 INSERT INTO profiles VALUES('${A}','Admin Teste','admin','${OA}',true),('${B}','Entregador Teste','entregador','${OB}',true);
 INSERT INTO user_roles(user_id,role) VALUES('${A}','admin'),('${B}','entregador');`);
}
function profile(id=A,role:'admin'|'user'|'entregador'='admin'):VerifiedProfile {
 return {id,name:'Teste',role,roles:[role],ativo:true,organization_id:id===A?OA:OB,organizations:{id:id===A?OA:OB,name:'Empresa Teste',owner_id:id}};
}
const session=(id:string)=>({user:{id},access_token:`fictional-${id}`} as Session);
const req=(body:unknown={},token='fixture',method='POST')=>new Request('http://localhost/profile',{method,headers:token?{Authorization:`Bearer ${token}`}:{},body:method==='POST'?JSON.stringify(body):undefined});
function repo(options:{id?:string|null;readError?:Failure;verifyError?:Failure}={}) {
 const calls={read:0,verify:0};
 return {calls, factory:()=>({authenticate:async()=>options.id===undefined?A:options.id,verify:async()=>{calls.verify++;if(options.verifyError)throw options.verifyError;},readSelf:async(id:string)=>{calls.read++;if(options.readError)throw options.readError;return profile(id);}})};
}
describe('isolated endpoint contract',()=> {
 it('01 no token returns 401 without reading or writing',async()=>{const r=repo();expect((await makeProfileHandler('recover',r.factory,{})(req({},''))).status).toBe(401);expect(r.calls).toEqual({read:0,verify:0});});
 it.each(['invalid','expired'])('02 %s token returns 401',async(token)=>{const r=repo({id:null});expect((await makeProfileHandler('recover',r.factory,{})(req({},token))).status).toBe(401);expect(r.calls.verify).toBe(0);});
 it('03 wrong method and CORS preflight',async()=>{const r=repo(),h=makeProfileHandler('read',r.factory,{'Access-Control-Allow-Origin':'*'});expect((await h(req({},'fixture','GET'))).status).toBe(405);expect((await h(req({},'','OPTIONS'))).status).toBe(200);expect(r.calls.read).toBe(0);});
 it('04 malformed JSON and forbidden fields',async()=>{const h=makeProfileHandler('read',repo().factory,{});expect((await h(new Request('http://localhost',{method:'POST',headers:{Authorization:'Bearer fixture'},body:'{'}))).status).toBe(400);for(const body of [{role:'admin'},{organization_id:OB},{name:'Unsafe'},{user_id:'invalid'},null,[]])expect((await h(req(body))).status).toBe(400);});
 it.each(['read','recover'] as const)('05/06 even admin cannot %s B',async(mode)=>{const r=repo();expect((await makeProfileHandler(mode,r.factory,{})(req({user_id:B}))).status).toBe(403);expect(r.calls).toEqual({read:0,verify:0});});
 it('07 valid self read has correct organization and no writes',async()=>{const r=repo();const response=await makeProfileHandler('read',r.factory,{})(req({user_id:A}));expect(response.status).toBe(200);expect(await response.json()).toEqual(profile());expect(r.calls.verify).toBe(0);});
 it('08 missing profile read never recovers',async()=>{const r=repo({readError:new Failure(404,'PROFILE_NOT_FOUND')});expect((await makeProfileHandler('read',r.factory,{})(req())).status).toBe(404);expect(r.calls.verify).toBe(0);});
 it.each(['PROFILE_UNAVAILABLE','ROLE_UNAVAILABLE','ORGANIZATION_UNAVAILABLE'])('09 %s fail closed',async(code)=>{const r=repo({readError:new Failure(503,code)});expect((await makeProfileHandler('read',r.factory,{})(req())).status).toBe(503);expect(r.calls.verify).toBe(0);});
 it('11 revised missing activation blocks even owner with canonical role',async()=>{const r=repo({verifyError:new Failure(409,'PROFILE_REPAIR_REQUIRED')});expect((await makeProfileHandler('recover',r.factory,{})(req())).status).toBe(409);expect(r.calls.read).toBe(0);});
});
describe('real disposable PostgreSQL / direct RPC / evidence',()=> {
 it.each(['false','NULL'])('10 ativo=%s blocks direct RPC',active=>{fixture();sql(`UPDATE profiles SET ativo=${active} WHERE id='${A}'`);expect(()=>asUser(A,'SELECT g0_recover_own_profile()')).toThrow(/PROFILE_NOT_VERIFIED/);});
 it('10 divergent mirror blocks RPC',()=>{fixture();sql(`UPDATE profiles SET role='user' WHERE id='${A}'`);expect(()=>asUser(A,'SELECT g0_recover_own_profile()')).toThrow(/ROLE_NOT_VERIFIED/);});
 it('11 missing owner profile is not recreated despite role and owner evidence',()=>{fixture();sql(`DELETE FROM profiles WHERE id='${A}'`);expect(()=>asUser(A,'SELECT g0_recover_own_profile()')).toThrow(/PROFILE_REPAIR_REQUIRED/);expect(sql(`SELECT count(*) FROM profiles WHERE id='${A}'`)).toBe('0');expect(sql('SELECT count(*) FROM user_roles')).toBe('2');expect(sql('SELECT count(*) FROM organizations')).toBe('2');});
 it.each(['DELETE FROM user_roles WHERE user_id=','UPDATE profiles SET organization_id=NULL WHERE id='])('12 unverifiable existing profile denied: %s',change=>{fixture();sql(`${change}'${A}'`);expect(()=>asUser(A,'SELECT g0_recover_own_profile()')).toThrow(/ROLE_NOT_VERIFIED|PROFILE_NOT_VERIFIED/);});
 it('12 multiple canonical roles denied',()=>{fixture();sql(`INSERT INTO user_roles(user_id,role) VALUES('${A}','user')`);expect(()=>asUser(A,'SELECT g0_recover_own_profile()')).toThrow(/ROLE_NOT_VERIFIED/);});
 it('14 no-token direct RPC denied',()=>{fixture();expect(()=>sql("BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','',true);SELECT g0_recover_own_profile();ROLLBACK;")).toThrow(/AUTH_REQUIRED/);expect(()=>sql('SET ROLE anon;SELECT g0_recover_own_profile()')).toThrow(/permission denied/);});
 it('13 simultaneous missing-profile requests are consistently blocked without writes',async()=>{
  fixture();sql(`DELETE FROM profiles WHERE id='${A}'`);
  const run=promisify(execFile);
  const query=`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${A}',true); SELECT g0_recover_own_profile(); COMMIT;`;
  const results=await Promise.allSettled([1,2].map(()=>run('psql',['postgresql://g0test@127.0.0.1:55439/postgres?sslmode=disable','-X','-qAt','-v','ON_ERROR_STOP=1','-c',query],{env:{PATH:process.env.PATH}})));
  expect(results.every(r=>r.status==='rejected')).toBe(true);
  expect(sql(`SELECT count(*) FROM profiles WHERE id='${A}'`)).toBe('0');
  expect(sql('SELECT count(*) FROM organizations')).toBe('2');expect(sql('SELECT count(*) FROM user_roles')).toBe('2');
 });
 it('14 RPC has no target argument and never changes either company or role',()=>{fixture();const before=sql("SELECT json_agg(t)::text FROM (SELECT * FROM profiles ORDER BY id)t");asUser(A,'SELECT g0_recover_own_profile()');expect(sql("SELECT json_agg(t)::text FROM (SELECT * FROM profiles ORDER BY id)t")).toBe(before);expect(()=>asUser(A,`SELECT g0_recover_own_profile('${B}')`)).toThrow(/does not exist/);});
 it('15/16 legitimate signup trigger creates one owner organization and admin; metadata cannot select company or role',()=>{fixture();const C='10000000-0000-4000-8000-000000000003';sql(`INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES('${C}','signup@example.invalid','{"name":"Cadastro Teste","role":"entregador","organization_id":"${OB}"}')`);expect(sql(`SELECT role||':'||ativo FROM profiles WHERE id='${C}'`)).toBe('admin:true');expect(sql(`SELECT count(*) FROM organizations WHERE owner_id='${C}'`)).toBe('1');expect(sql(`SELECT count(*) FROM user_roles WHERE user_id='${C}' AND role='admin'`)).toBe('1');asUser(C,'SELECT g0_recover_own_profile()');});
 it('21 owner cannot transfer company or alter identity',()=>{fixture();expect(()=>asUser(A,`UPDATE organizations SET owner_id='${B}' WHERE id='${OA}'`)).toThrow(/OWNERSHIP_CHANGE_FORBIDDEN/);expect(()=>asUser(A,`UPDATE organizations SET id=gen_random_uuid() WHERE id='${OA}'`)).toThrow(/OWNERSHIP_CHANGE_FORBIDDEN/);});
 it('22 fabricated company cannot activate a missing profile',()=>{fixture();sql(`DELETE FROM profiles WHERE id='${A}'`);expect(()=>asUser(A,`INSERT INTO organizations(name,owner_id) VALUES('Fabricated Test','${A}'); SELECT g0_recover_own_profile()`)).toThrow(/PROFILE_REPAIR_REQUIRED/);expect(sql(`SELECT count(*) FROM profiles WHERE id='${A}'`)).toBe('0');});
 it('23 direct role writes and self role RPC are blocked',()=>{fixture();expect(()=>asUser(A,`INSERT INTO user_roles(user_id,role) VALUES('${A}','user')`)).toThrow(/permission denied/);expect(()=>asUser(A,`UPDATE user_roles SET role='user' WHERE user_id='${A}'`)).toThrow(/permission denied/);expect(()=>asUser(A,`SELECT set_user_role('${A}','user')`)).toThrow(/ROLE_CHANGE_FORBIDDEN/);});
 it('24 self profile activation/company/role/insert cannot forge evidence',()=>{fixture();sql(`UPDATE profiles SET ativo=NULL WHERE id='${A}'`);for(const change of ['ativo=true',"role='user'",`organization_id='${OB}'`])expect(()=>asUser(A,`UPDATE profiles SET ${change} WHERE id='${A}'`)).toThrow(/PROFILE_CHANGE_FORBIDDEN/);expect(()=>asUser(A,`INSERT INTO profiles(id,name,role,ativo) VALUES('${A}','Fake','user',true)`)).toThrow(/permission denied/);});
 it('25 cross-company role changes blocked; legitimate same-company admin change works',()=>{fixture();expect(()=>asUser(A,`SELECT set_user_role('${B}','user')`)).toThrow(/ROLE_CHANGE_FORBIDDEN/);sql(`UPDATE profiles SET organization_id='${OA}' WHERE id='${B}'`);
 const result=asUser(A,`SELECT set_user_role('${B}','user'); SELECT role FROM profiles WHERE id='${B}'; SELECT role FROM user_roles WHERE user_id='${B}'`);
 expect(result.split('\n').filter(v=>v==='user')).toHaveLength(2);});
 it('17 recovery session self-read RPC leaves organization and role unchanged',()=>{fixture();const before=sql("SELECT json_agg(t)::text FROM (SELECT * FROM profiles ORDER BY id)t");asUser(A,'SELECT g0_recover_own_profile()');expect(sql("SELECT json_agg(t)::text FROM (SELECT * FROM profiles ORDER BY id)t")).toBe(before);});
});
describe('authentication race and permission controller',()=> {
 it('18 switching A to B clears authorization and ignores late A',async()=>{const states:VerificationState[]=[];let resolveA:(p:VerifiedProfile)=>void=()=>{};const late=new Promise<VerifiedProfile>(r=>resolveA=r);const c=createVerificationController(id=>id===A?late:Promise.resolve(profile(B,'entregador')),s=>states.push(s));const a=c.change(session(A));const b=c.change(session(B));expect(states.at(-1)?.profile).toBeNull();expect(states.at(-1)?.ready).toBe(false);await b;resolveA(profile());await a;expect(states.at(-1)?.profile?.id).toBe(B);expect(states.at(-1)?.profile?.role).toBe('entregador');});
 it('18 logout ignores delayed profile',async()=>{let resolve:(p:VerifiedProfile)=>void=()=>{};const states:VerificationState[]=[];const c=createVerificationController(()=>new Promise(r=>resolve=r),s=>states.push(s));const pending=c.change(session(A));await c.change(null);resolve(profile());await pending;expect(states.at(-1)?.session).toBeNull();expect(states.at(-1)?.profile).toBeNull();});
 it('19 lookup failure never authorizes, cached identity alone never authorizes',async()=>{const states:VerificationState[]=[];const c=createVerificationController(async()=>{throw new Error('offline');},s=>states.push(s));expect(await c.change(session(A))).toBe(false);expect(states.at(-1)?.ready).toBe(false);expect(canUseRole({ready:false,error:false,roles:['admin']},'admin')).toBe(false);expect(verifiedRole({ready:true,error:true,roles:['admin']})).toBeNull();});
 it.each(['admin','entregador'] as const)('20 legitimate %s keeps canonical role',async(role)=>{const states:VerificationState[]=[];const c=createVerificationController(async()=>profile(A,role),s=>states.push(s));expect(await c.change(session(A))).toBe(true);const end=states.at(-1);expect(end?.profile?.role).toBe(role);expect(canUseRole({ready:end?.ready??false,error:false,roles:end?.profile?.roles??[]},role)).toBe(true);});
 it('pending verification cannot render administrative permissions',()=>{expect(canUseRole({ready:false,error:false,roles:[]},'admin')).toBe(false);expect(verifiedRole({ready:true,error:false,roles:[]})).toBeNull();});
});