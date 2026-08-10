GRANT EXECUTE ON FUNCTION public.get_my_org() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;