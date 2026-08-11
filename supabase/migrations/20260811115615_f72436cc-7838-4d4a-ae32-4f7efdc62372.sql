CREATE TABLE public.fechamentos_caixa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  data_fechamento date NOT NULL,
  tipo text NOT NULL DEFAULT 'total',
  total_vendas numeric NOT NULL DEFAULT 0,
  total_dinheiro numeric NOT NULL DEFAULT 0,
  total_pix numeric NOT NULL DEFAULT 0,
  total_cartao numeric NOT NULL DEFAULT 0,
  total_outros numeric NOT NULL DEFAULT 0,
  quantidades jsonb NOT NULL DEFAULT '{}'::jsonb,
  estoque_final jsonb NOT NULL DEFAULT '{}'::jsonb,
  divergencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  tem_divergencia boolean NOT NULL DEFAULT false,
  observacoes text,
  retroativo boolean NOT NULL DEFAULT false,
  fechado_por uuid DEFAULT auth.uid(),
  fechado_por_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fechamentos_caixa TO authenticated;
GRANT ALL ON public.fechamentos_caixa TO service_role;

ALTER TABLE public.fechamentos_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage fechamentos"
ON public.fechamentos_caixa FOR ALL TO authenticated
USING (organization_id = public.get_my_org())
WITH CHECK (organization_id = public.get_my_org());

CREATE TRIGGER fechamentos_caixa_updated_at
BEFORE UPDATE ON public.fechamentos_caixa
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_fechamentos_caixa_data ON public.fechamentos_caixa (organization_id, data_fechamento DESC);