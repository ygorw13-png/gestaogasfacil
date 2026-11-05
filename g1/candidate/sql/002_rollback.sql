-- Executar com psql -1 (transação única).
-- SOMENTE LABORATÓRIO: reabre as falhas corrigidas pelo 002. Não é contingência de produção (use correção de cadastro / contenção).
-- Contenção: restaura exatamente as definições publicadas em 04/11/2026 (lidas do banco).
CREATE OR REPLACE FUNCTION public.get_my_org() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid() $$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE OR REPLACE FUNCTION public.current_profile_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;
DROP POLICY IF EXISTS "org members access orders" ON public.orders;
CREATE POLICY "user owns or org orders" ON public.orders FOR ALL TO authenticated USING ((user_id = auth.uid()) OR (organization_id = get_my_org())) WITH CHECK ((user_id = auth.uid()) OR (organization_id = get_my_org()));
DROP POLICY IF EXISTS "org reads dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "org writes own dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "org updates own dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "org deletes own dashboard_data" ON public.dashboard_data;
CREATE POLICY "user reads own dashboard_data" ON public.dashboard_data FOR SELECT TO authenticated USING ((user_id = (auth.uid())::text) OR (user_id = 'system'::text));
CREATE POLICY "user writes own dashboard_data" ON public.dashboard_data FOR INSERT TO authenticated WITH CHECK ((user_id = (auth.uid())::text) OR (user_id = 'system'::text));
CREATE POLICY "user updates own dashboard_data" ON public.dashboard_data FOR UPDATE TO authenticated USING ((user_id = (auth.uid())::text) OR (user_id = 'system'::text));
CREATE POLICY "user deletes own dashboard_data" ON public.dashboard_data FOR DELETE TO authenticated USING (user_id = (auth.uid())::text);
DROP POLICY IF EXISTS "entregador can update own location" ON public.entregador_localizacoes;
CREATE POLICY "entregador can update own location" ON public.entregador_localizacoes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()) AND (role = 'user'::text));
-- registrar_movimentacao_portaria: a versão candidata só acrescenta a recusa explícita;
-- com get_my_org() original a função volta ao comportamento publicado sem precisar ser trocada.
