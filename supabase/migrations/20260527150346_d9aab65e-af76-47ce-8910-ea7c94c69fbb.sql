
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============ ORGANIZATIONS ============
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_my_org()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid() $$;

-- ============ POLICIES: profiles / orgs / roles ============
CREATE POLICY "users see profiles in their org" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = public.get_my_org());
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users see their org" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_my_org() OR owner_id = auth.uid());
CREATE POLICY "owners update their org" ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "any auth can create org" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============ Auto profile/org/role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _name TEXT;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  INSERT INTO public.organizations (name, owner_id)
    VALUES (_name || '''s Organization', NEW.id)
    RETURNING id INTO _org_id;
  INSERT INTO public.profiles (id, name, role, organization_id)
    VALUES (NEW.id, _name, 'admin', _org_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Generic updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COLABORADORES ============
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  data_admissao DATE NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  organization_id UUID NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members access colaboradores" ON public.colaboradores FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  cliente TEXT,
  telefone TEXT,
  endereco TEXT,
  produto TEXT,
  quantidade INTEGER DEFAULT 1,
  valor NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  metodo_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members access orders" ON public.orders FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- ============ DASHBOARD DATA ============
CREATE TABLE public.dashboard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_data TO authenticated;
GRANT ALL ON public.dashboard_data TO service_role;
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members access dashboard_data" ON public.dashboard_data FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- ============ CONFIG TABLES (estoque, sistema, financeiras, entrega, seguranca, notificacoes) ============
CREATE TABLE public.configuracoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto TEXT NOT NULL,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  alerta_ativo BOOLEAN NOT NULL DEFAULT true,
  destinatarios_alerta JSONB,
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_estoque TO authenticated;
GRANT ALL ON public.configuracoes_estoque TO service_role;
ALTER TABLE public.configuracoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members access configuracoes_estoque" ON public.configuracoes_estoque FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() OR organization_id IS NULL)
  WITH CHECK (organization_id = public.get_my_org() OR organization_id IS NULL);

CREATE TABLE public.configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_sistema TO authenticated;
GRANT ALL ON public.configuracoes_sistema TO service_role;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access configuracoes_sistema" ON public.configuracoes_sistema FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() OR organization_id IS NULL)
  WITH CHECK (organization_id = public.get_my_org() OR organization_id IS NULL);

CREATE TABLE public.configuracoes_financeiras (LIKE public.configuracoes_sistema INCLUDING ALL);
ALTER TABLE public.configuracoes_financeiras ALTER COLUMN id SET DEFAULT gen_random_uuid();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_financeiras TO authenticated;
GRANT ALL ON public.configuracoes_financeiras TO service_role;
ALTER TABLE public.configuracoes_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access configuracoes_financeiras" ON public.configuracoes_financeiras FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() OR organization_id IS NULL)
  WITH CHECK (organization_id = public.get_my_org() OR organization_id IS NULL);

CREATE TABLE public.configuracoes_entrega (LIKE public.configuracoes_sistema INCLUDING ALL);
ALTER TABLE public.configuracoes_entrega ALTER COLUMN id SET DEFAULT gen_random_uuid();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_entrega TO authenticated;
GRANT ALL ON public.configuracoes_entrega TO service_role;
ALTER TABLE public.configuracoes_entrega ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access configuracoes_entrega" ON public.configuracoes_entrega FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() OR organization_id IS NULL)
  WITH CHECK (organization_id = public.get_my_org() OR organization_id IS NULL);

CREATE TABLE public.configuracoes_seguranca (LIKE public.configuracoes_sistema INCLUDING ALL);
ALTER TABLE public.configuracoes_seguranca ALTER COLUMN id SET DEFAULT gen_random_uuid();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_seguranca TO authenticated;
GRANT ALL ON public.configuracoes_seguranca TO service_role;
ALTER TABLE public.configuracoes_seguranca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access configuracoes_seguranca" ON public.configuracoes_seguranca FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() OR organization_id IS NULL)
  WITH CHECK (organization_id = public.get_my_org() OR organization_id IS NULL);

CREATE TABLE public.configuracoes_notificacoes (LIKE public.configuracoes_sistema INCLUDING ALL);
ALTER TABLE public.configuracoes_notificacoes ALTER COLUMN id SET DEFAULT gen_random_uuid();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_notificacoes TO authenticated;
GRANT ALL ON public.configuracoes_notificacoes TO service_role;
ALTER TABLE public.configuracoes_notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access configuracoes_notificacoes" ON public.configuracoes_notificacoes FOR ALL TO authenticated
  USING (organization_id = public.get_my_org() OR organization_id IS NULL)
  WITH CHECK (organization_id = public.get_my_org() OR organization_id IS NULL);

-- ============ REQUISICOES ESTOQUE ============
CREATE TABLE public.requisicoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  solicitante_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_processamento TIMESTAMPTZ,
  processado_por UUID,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes_estoque TO authenticated;
GRANT ALL ON public.requisicoes_estoque TO service_role;
ALTER TABLE public.requisicoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access requisicoes_estoque" ON public.requisicoes_estoque FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- ============ CASCOS EMPRESTADOS ============
CREATE TABLE public.cascos_emprestados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  tipo_cliente TEXT NOT NULL,
  tipo_vasilhame TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  data_emprestimo DATE NOT NULL DEFAULT CURRENT_DATE,
  data_devolucao DATE,
  status TEXT NOT NULL DEFAULT 'emprestado',
  registrado_por UUID NOT NULL,
  observacoes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cascos_emprestados TO authenticated;
GRANT ALL ON public.cascos_emprestados TO service_role;
ALTER TABLE public.cascos_emprestados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access cascos_emprestados" ON public.cascos_emprestados FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
