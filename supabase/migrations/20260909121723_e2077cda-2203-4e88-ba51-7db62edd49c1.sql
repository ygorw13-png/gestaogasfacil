REVOKE EXECUTE ON FUNCTION public.registrar_movimentacao_portaria(text,text,integer,integer,integer,uuid,text,uuid,text,date) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

REVOKE EXECUTE ON FUNCTION public.current_profile_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;

DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING ((id = auth.uid()) OR (has_role(auth.uid(), 'admin') AND organization_id = get_my_org()))
WITH CHECK (
  (
    id = auth.uid()
    AND role IS NOT DISTINCT FROM public.current_profile_role()
    AND organization_id IS NOT DISTINCT FROM get_my_org()
  )
  OR (has_role(auth.uid(), 'admin') AND organization_id = get_my_org())
);

CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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