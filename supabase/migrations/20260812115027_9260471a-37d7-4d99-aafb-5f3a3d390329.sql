CREATE TABLE public.trocas_cheque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text,
  taxa_juros_mensal numeric NOT NULL DEFAULT 3,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_valor numeric NOT NULL DEFAULT 0,
  total_juros numeric NOT NULL DEFAULT 0,
  total_liquido numeric NOT NULL DEFAULT 0,
  observacoes text,
  criado_por uuid DEFAULT auth.uid(),
  criado_por_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trocas_cheque TO authenticated;
GRANT ALL ON public.trocas_cheque TO service_role;
ALTER TABLE public.trocas_cheque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage trocas_cheque" ON public.trocas_cheque
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE TRIGGER trocas_cheque_updated_at BEFORE UPDATE ON public.trocas_cheque
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();