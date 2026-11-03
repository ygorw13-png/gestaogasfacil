-- RELEASE CANDIDATE ONLY. Not applied to Cloud.
-- Missing profiles cannot be reconstructed: no independent activation evidence exists.
CREATE OR REPLACE FUNCTION public.g0_recover_own_profile()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_role text;
  v_count bigint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='AUTH_REQUIRED';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));
  SELECT * INTO v_profile FROM public.profiles WHERE id=v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='PROFILE_REPAIR_REQUIRED';
  END IF;
  IF v_profile.ativo IS NOT TRUE OR v_profile.organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PROFILE_NOT_VERIFIED';
  END IF;
  SELECT count(*), min(role::text) INTO v_count, v_role
    FROM public.user_roles WHERE user_id=v_uid;
  IF v_count <> 1 OR v_role NOT IN ('admin','user','entregador')
    OR v_profile.role IS DISTINCT FROM v_role THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='ROLE_NOT_VERIFIED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id=v_profile.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='ORGANIZATION_NOT_VERIFIED';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.g0_recover_own_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.g0_recover_own_profile() TO authenticated;
COMMENT ON FUNCTION public.g0_recover_own_profile() IS 'Self-only existing-profile verification; no recovery insertion without trusted independent activation evidence.';

-- Existing INSERT policy cannot establish trusted identity/activation.
REVOKE INSERT ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.g01_guard_organization_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND
    (NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.id IS DISTINCT FROM OLD.id) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='OWNERSHIP_CHANGE_FORBIDDEN';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER g01_organization_owner_guard BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.g01_guard_organization_owner();
REVOKE ALL ON FUNCTION public.g01_guard_organization_owner() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_caller public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='IDENTITY_CHANGE_FORBIDDEN';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.ativo IS DISTINCT FROM OLD.ativo THEN
    SELECT * INTO v_caller FROM public.profiles WHERE id=auth.uid();
    IF OLD.id=auth.uid() OR v_caller.ativo IS NOT TRUE
      OR NOT public.has_role(auth.uid(),'admin'::public.app_role)
      OR v_caller.organization_id IS DISTINCT FROM OLD.organization_id
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
      OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=OLD.id AND role::text=NEW.role) THEN
      RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='PROFILE_CHANGE_FORBIDDEN';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profiles_guard_privileged_fields() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_caller public.profiles%ROWTYPE; v_target public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_caller FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
  IF auth.uid() IS NULL OR _user_id=auth.uid() OR v_caller.ativo IS NOT TRUE
    OR NOT public.has_role(auth.uid(),'admin'::public.app_role) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='ROLE_CHANGE_FORBIDDEN';
  END IF;
  SELECT * INTO v_target FROM public.profiles WHERE id=_user_id FOR UPDATE;
  IF NOT FOUND OR v_caller.organization_id IS NULL
    OR v_target.organization_id IS DISTINCT FROM v_caller.organization_id THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='ROLE_CHANGE_FORBIDDEN';
  END IF;
  DELETE FROM public.user_roles WHERE user_id=_user_id;
  INSERT INTO public.user_roles(user_id,role) VALUES (_user_id,_role);
  UPDATE public.profiles SET role=_role::text WHERE id=_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_user_role(uuid,public.app_role) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid,public.app_role) TO authenticated;