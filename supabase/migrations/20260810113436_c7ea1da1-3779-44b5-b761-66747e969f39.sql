-- 1. Fix NULL organization_id bypass
UPDATE public.clients c SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE c.organization_id IS NULL AND (SELECT count(*) FROM public.organizations) = 1;

DELETE FROM public.clients WHERE organization_id IS NULL;
ALTER TABLE public.clients ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;

DROP POLICY IF EXISTS "org access clients" ON public.clients;
CREATE POLICY "org access clients" ON public.clients FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

DROP POLICY IF EXISTS "org members access configuracoes_estoque" ON public.configuracoes_estoque;
ALTER TABLE public.configuracoes_estoque ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
CREATE POLICY "org members access configuracoes_estoque" ON public.configuracoes_estoque FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

DROP POLICY IF EXISTS "org access cfg sistema" ON public.configuracoes_sistema;
ALTER TABLE public.configuracoes_sistema ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
CREATE POLICY "org access cfg sistema" ON public.configuracoes_sistema FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

DROP POLICY IF EXISTS "org access cfg fin" ON public.configuracoes_financeiras;
ALTER TABLE public.configuracoes_financeiras ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
CREATE POLICY "org access cfg fin" ON public.configuracoes_financeiras FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

DROP POLICY IF EXISTS "org access cfg entrega" ON public.configuracoes_entrega;
ALTER TABLE public.configuracoes_entrega ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
CREATE POLICY "org access cfg entrega" ON public.configuracoes_entrega FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

DROP POLICY IF EXISTS "org access cfg seg" ON public.configuracoes_seguranca;
ALTER TABLE public.configuracoes_seguranca ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
CREATE POLICY "org access cfg seg" ON public.configuracoes_seguranca FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

DROP POLICY IF EXISTS "org access cfg notif" ON public.configuracoes_notificacoes;
ALTER TABLE public.configuracoes_notificacoes ALTER COLUMN organization_id SET DEFAULT public.get_my_org();
CREATE POLICY "org access cfg notif" ON public.configuracoes_notificacoes FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

-- 2. profiles: prevent self role/org escalation
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'user');

DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR organization_id = public.get_my_org());

CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    IF NOT public.has_role(auth.uid(), 'admin')
       OR OLD.organization_id IS DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    THEN
      RAISE EXCEPTION 'Somente administradores da organização podem alterar função ou organização';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged ON public.profiles;
CREATE TRIGGER profiles_guard_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileged_fields();

-- 3. colaboradores: admin only
DROP POLICY IF EXISTS "org members access colaboradores" ON public.colaboradores;
CREATE POLICY "admins access colaboradores" ON public.colaboradores FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = public.get_my_org() AND public.has_role(auth.uid(), 'admin'));

-- 4. entregador_localizacoes: own row or admin
DROP POLICY IF EXISTS "org members can view locations" ON public.entregador_localizacoes;
CREATE POLICY "own or admin can view locations" ON public.entregador_localizacoes FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')));

-- 5. Lock down SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.clear_test_data() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_org() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.registrar_movimentacao_portaria(text, text, integer, integer, integer, uuid, text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.orders_set_defaults() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_guard_privileged_fields() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.clear_test_data() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_org() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_portaria(text, text, integer, integer, integer, uuid, text, uuid, text) TO authenticated, service_role;