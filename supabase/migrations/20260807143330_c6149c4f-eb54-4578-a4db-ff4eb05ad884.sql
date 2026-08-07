CREATE TABLE public.tarefas_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  competencia text NOT NULL,
  boletos_ok boolean NOT NULL DEFAULT false,
  notas_fiscais_ok boolean NOT NULL DEFAULT false,
  contabilidade_ok boolean NOT NULL DEFAULT false,
  observacoes text,
  conferido_por uuid,
  conferido_por_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, competencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas_mensais TO authenticated;
GRANT ALL ON public.tarefas_mensais TO service_role;

ALTER TABLE public.tarefas_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage tarefas_mensais"
ON public.tarefas_mensais FOR ALL TO authenticated
USING (organization_id = public.get_my_org())
WITH CHECK (organization_id = public.get_my_org());

CREATE TRIGGER tarefas_mensais_updated_at
BEFORE UPDATE ON public.tarefas_mensais
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();