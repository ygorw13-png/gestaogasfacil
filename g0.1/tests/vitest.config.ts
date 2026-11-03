import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
export default defineConfig({
 plugins:[react()],
 resolve:{alias:[
  {find:'npm:@supabase/supabase-js@2/cors',replacement:'@supabase/supabase-js/cors'},
  {find:'npm:@supabase/supabase-js@2',replacement:'@supabase/supabase-js'},
  {find:'@/contexts/auth',replacement:path.resolve('g0.1/candidate/src/contexts/auth')},
  {find:'@',replacement:path.resolve('src')}
 ]},
 test:{environment:'jsdom',include:['g0.1/tests/*.test.ts','g0.1/tests/*.test.tsx'],poolOptions:{threads:{singleThread:true}}},
});