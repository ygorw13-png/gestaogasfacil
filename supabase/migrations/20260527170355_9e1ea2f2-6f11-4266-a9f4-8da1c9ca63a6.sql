
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_org uuid;
  _target_org uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar roles';
  END IF;
  SELECT organization_id INTO _caller_org FROM public.profiles WHERE id = auth.uid();
  SELECT organization_id INTO _target_org FROM public.profiles WHERE id = _user_id;
  IF _caller_org IS NULL OR _caller_org <> _target_org THEN
    RAISE EXCEPTION 'Usuário não pertence à sua organização';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role);
  UPDATE public.profiles SET role = _role::text WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, app_role) TO authenticated;
