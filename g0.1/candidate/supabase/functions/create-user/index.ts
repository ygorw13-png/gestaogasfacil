// G0.1 RELEASE CANDIDATE. Not deployed.
import { corsHeaders } from 'npm:@supabase/supabase-js@2.106.2/cors';
import { createUser, makeAdminHandler } from '../_shared/g01-admin-core.ts';
import { makeRepository } from '../_shared/g01-admin.ts';

Deno.serve(makeAdminHandler(createUser, makeRepository, corsHeaders, (code) => console.error('create-user', code)));
