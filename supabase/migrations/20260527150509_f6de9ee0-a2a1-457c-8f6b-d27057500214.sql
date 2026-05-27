
-- Fix search_path on existing functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Restrict EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_org() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org() TO authenticated;

-- ========== ORDERS: recreate matching code shape ==========
DROP TABLE IF EXISTS public.orders CASCADE;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  address JSONB,
  product TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(12,2) DEFAULT 0,
  has_empty_cylinder BOOLEAN DEFAULT false,
  is_complete_package BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns orders" ON public.orders FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Auto-fill organization_id and user_id on insert
CREATE OR REPLACE FUNCTION public.orders_set_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
  IF NEW.organization_id IS NULL THEN NEW.organization_id := public.get_my_org(); END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.orders_set_defaults() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER orders_defaults BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_set_defaults();

-- ========== DASHBOARD_DATA: recreate with stock_data, sales_data ==========
DROP TABLE IF EXISTS public.dashboard_data CASCADE;
CREATE TABLE public.dashboard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  organization_id UUID,
  stock_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sales_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_data TO authenticated;
GRANT ALL ON public.dashboard_data TO service_role;
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read dashboard_data" ON public.dashboard_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write dashboard_data" ON public.dashboard_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== CLIENTS ==========
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  phone TEXT,
  address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access clients" ON public.clients FOR ALL TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_my_org())
  WITH CHECK (organization_id IS NULL OR organization_id = public.get_my_org());

-- ========== CONFIG TABLES: drop and recreate with proper columns ==========
DROP TABLE IF EXISTS public.configuracoes_sistema CASCADE;
CREATE TABLE public.configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  nome_empresa TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_sistema TO authenticated;
GRANT ALL ON public.configuracoes_sistema TO service_role;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access cfg sistema" ON public.configuracoes_sistema FOR ALL TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_my_org())
  WITH CHECK (organization_id IS NULL OR organization_id = public.get_my_org());

DROP TABLE IF EXISTS public.configuracoes_financeiras CASCADE;
CREATE TABLE public.configuracoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  moeda TEXT DEFAULT 'BRL',
  taxa_imposto NUMERIC(6,2) DEFAULT 0,
  metodos_pagamento JSONB DEFAULT '[]'::jsonb,
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_financeiras TO authenticated;
GRANT ALL ON public.configuracoes_financeiras TO service_role;
ALTER TABLE public.configuracoes_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access cfg fin" ON public.configuracoes_financeiras FOR ALL TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_my_org())
  WITH CHECK (organization_id IS NULL OR organization_id = public.get_my_org());

DROP TABLE IF EXISTS public.configuracoes_entrega CASCADE;
CREATE TABLE public.configuracoes_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  taxa_entrega NUMERIC(12,2) DEFAULT 0,
  valor_min_entrega_gratis NUMERIC(12,2) DEFAULT 0,
  raio_maximo_km NUMERIC(8,2) DEFAULT 0,
  rastreamento_ativo BOOLEAN DEFAULT false,
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_entrega TO authenticated;
GRANT ALL ON public.configuracoes_entrega TO service_role;
ALTER TABLE public.configuracoes_entrega ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access cfg entrega" ON public.configuracoes_entrega FOR ALL TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_my_org())
  WITH CHECK (organization_id IS NULL OR organization_id = public.get_my_org());

DROP TABLE IF EXISTS public.configuracoes_seguranca CASCADE;
CREATE TABLE public.configuracoes_seguranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  tempo_sessao_minutos INTEGER DEFAULT 60,
  expiracao_senha_dias INTEGER DEFAULT 90,
  dois_fatores_ativo BOOLEAN DEFAULT false,
  nivel_log TEXT DEFAULT 'info',
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_seguranca TO authenticated;
GRANT ALL ON public.configuracoes_seguranca TO service_role;
ALTER TABLE public.configuracoes_seguranca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access cfg seg" ON public.configuracoes_seguranca FOR ALL TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_my_org())
  WITH CHECK (organization_id IS NULL OR organization_id = public.get_my_org());

DROP TABLE IF EXISTS public.configuracoes_notificacoes CASCADE;
CREATE TABLE public.configuracoes_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  email_ativo BOOLEAN DEFAULT true,
  sms_ativo BOOLEAN DEFAULT false,
  notificacao_pedidos BOOLEAN DEFAULT true,
  notificacao_estoque BOOLEAN DEFAULT true,
  atualizado_por UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_notificacoes TO authenticated;
GRANT ALL ON public.configuracoes_notificacoes TO service_role;
ALTER TABLE public.configuracoes_notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access cfg notif" ON public.configuracoes_notificacoes FOR ALL TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_my_org())
  WITH CHECK (organization_id IS NULL OR organization_id = public.get_my_org());

-- ========== clear_test_data RPC ==========
CREATE OR REPLACE FUNCTION public.clear_test_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.orders WHERE user_id = auth.uid();
  DELETE FROM public.dashboard_data WHERE user_id::uuid = auth.uid();
END;
$$;
REVOKE EXECUTE ON FUNCTION public.clear_test_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_test_data() TO authenticated;
