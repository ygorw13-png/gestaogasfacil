ALTER TABLE public.promissory_notes ALTER COLUMN organization_id SET DEFAULT public.get_my_org();

DROP FUNCTION IF EXISTS public.clear_test_data();

REVOKE ALL ON FUNCTION public.get_my_org() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org() TO service_role;