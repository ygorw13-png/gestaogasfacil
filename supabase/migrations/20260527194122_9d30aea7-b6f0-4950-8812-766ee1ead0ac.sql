
-- Birthday for clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Message templates per organization
CREATE TABLE IF NOT EXISTS public.templates_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  tipo text NOT NULL,
  conteudo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates_mensagem TO authenticated;
GRANT ALL ON public.templates_mensagem TO service_role;
ALTER TABLE public.templates_mensagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access templates_mensagem" ON public.templates_mensagem
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates_mensagem
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recompra contacts log
CREATE TABLE IF NOT EXISTS public.contatos_recompra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  cliente_id uuid NOT NULL,
  cliente_nome text NOT NULL,
  tipo text NOT NULL,
  canal text NOT NULL DEFAULT 'whatsapp',
  resultado text,
  observacao text,
  contatado_por uuid NOT NULL DEFAULT auth.uid(),
  contatado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contatos_recompra TO authenticated;
GRANT ALL ON public.contatos_recompra TO service_role;
ALTER TABLE public.contatos_recompra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access contatos_recompra" ON public.contatos_recompra
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE INDEX IF NOT EXISTS idx_contatos_recompra_cliente ON public.contatos_recompra(cliente_id, contatado_em DESC);
