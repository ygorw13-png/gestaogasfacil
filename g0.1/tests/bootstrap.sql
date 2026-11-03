-- Minimal fictional schema, not a backup or production export.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
GRANT USAGE ON SCHEMA auth,public TO authenticated,anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;
CREATE TYPE public.app_role AS ENUM ('admin','user','entregador');
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.organizations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,owner_id uuid NOT NULL);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.profiles(id uuid PRIMARY KEY,name text NOT NULL,role text NOT NULL,organization_id uuid,ativo boolean DEFAULT true);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,role public.app_role NOT NULL);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE FUNCTION public.get_my_org() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT organization_id FROM profiles WHERE id=auth.uid() $$;
CREATE POLICY org_read ON public.organizations FOR SELECT TO authenticated USING(id=get_my_org() OR owner_id=auth.uid());
CREATE POLICY org_insert ON public.organizations FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid());
CREATE POLICY org_update ON public.organizations FOR UPDATE TO authenticated USING(owner_id=auth.uid());
CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid() OR organization_id=get_my_org());
CREATE POLICY profile_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK(id=auth.uid() AND role='user');
CREATE POLICY profile_update ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid() OR (has_role(auth.uid(),'admin') AND organization_id=get_my_org()));
CREATE POLICY role_read ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.profiles_guard_privileged_fields() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER profiles_guard_privileged BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileged_fields();
-- Reproduce the existing new-user provisioning trigger for local-only verification.
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _org_id uuid; _name text;
BEGIN
 _name := coalesce(NEW.raw_user_meta_data->>'name', NEW.email);
 INSERT INTO public.organizations(name,owner_id) VALUES (_name||'''s Organization',NEW.id) RETURNING id INTO _org_id;
 INSERT INTO public.profiles(id,name,role,organization_id) VALUES (NEW.id,_name,'admin',_org_id);
 INSERT INTO public.user_roles(user_id,role) VALUES (NEW.id,'admin');
 RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();