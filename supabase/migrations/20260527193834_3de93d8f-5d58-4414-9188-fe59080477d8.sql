
-- Add ativo column to profiles for soft-deactivation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Routes table (real)
CREATE TABLE IF NOT EXISTS public.rotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  motorista_id uuid,
  motorista_nome text NOT NULL,
  destino text NOT NULL,
  clientes_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planejada',
  hora_saida text,
  hora_retorno text,
  inventario jsonb DEFAULT '{}'::jsonb,
  observacoes text,
  criado_por uuid NOT NULL DEFAULT auth.uid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rotas TO authenticated;
GRANT ALL ON public.rotas TO service_role;

ALTER TABLE public.rotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org access rotas" ON public.rotas
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

CREATE INDEX IF NOT EXISTS idx_rotas_org_data ON public.rotas(organization_id, data DESC);

CREATE TRIGGER rotas_set_updated_at
  BEFORE UPDATE ON public.rotas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
