import {it,expect,vi,beforeEach} from 'vitest';
const fake=vi.hoisted(()=>({active:true as boolean|null,role:'admin',roles:[{role:'admin'}],missing:false,stageError:'',rpcError:null as null|{message:string;code:string},calls:[] as string[]}));
vi.mock('npm:@supabase/supabase-js@2',()=>({createClient:()=>({
 auth:{getUser:async()=>({data:{user:{id:'10000000-0000-4000-8000-000000000001'}},error:null})},
 rpc:async()=>({error:fake.rpcError}),
 from:(table:string)=>{fake.calls.push(table);const query={select:()=>query,eq:()=>query,maybeSingle:async()=>table==='profiles'
 ? {data:fake.missing?null:{id:'10000000-0000-4000-8000-000000000001',name:'Teste',ativo:fake.active,role:fake.role,organization_id:'org-test'},error:fake.stageError===table?{}:null}
 :{data:{id:'org-test',name:'Empresa Teste',owner_id:'fictional-owner'},error:fake.stageError===table?{}:null},
 then:(resolve:(v:unknown)=>void)=>resolve({data:fake.roles,error:fake.stageError===table?{}:null})};return query;},
})}));
vi.mock('npm:@supabase/supabase-js@2/cors',()=>({corsHeaders:{'Access-Control-Allow-Origin':'*'}}));
import {profileHandler} from '../candidate/supabase/functions/_shared/g0-profile';
const request=()=>new Request('http://localhost/profile',{method:'POST',headers:{Authorization:'Bearer fictional-only'},body:'{}'});
beforeEach(()=>{Object.assign(fake,{active:true,role:'admin',roles:[{role:'admin'}],missing:false,stageError:'',rpcError:null,calls:[]});vi.stubGlobal('Deno',{env:{get:()=> 'fictional-config-not-used'}});});
it.each([false,null])('actual endpoint adapter blocks ativo=%s',async(active)=>{fake.active=active;const response=await profileHandler('read')(request());expect(response.status).toBe(403);expect(fake.calls).toEqual(['profiles']);});
it.each(['profiles','user_roles','organizations'])('actual adapter fails closed on %s query error',async(table)=>{fake.stageError=table;expect((await profileHandler('read')(request())).status).toBe(503);});
it('actual adapter blocks mirror divergence and missing profile',async()=>{fake.role='user';expect((await profileHandler('read')(request())).status).toBe(403);fake.missing=true;expect((await profileHandler('read')(request())).status).toBe(404);});
it('actual adapter returns own limited verified profile',async()=>{const response=await profileHandler('read')(request());expect(response.status).toBe(200);const data=await response.json();expect(data.roles).toEqual(['admin']);expect(data.organizations.id).toBe('org-test');expect(Object.keys(data).sort()).toEqual(['ativo','id','name','organization_id','organizations','role','roles']);});
it('actual recovery adapter maps missing activation evidence to administrative review',async()=>{fake.rpcError={message:'PROFILE_REPAIR_REQUIRED',code:'P0001'};const response=await profileHandler('recover')(request());expect(response.status).toBe(409);expect(fake.calls).toHaveLength(0);});