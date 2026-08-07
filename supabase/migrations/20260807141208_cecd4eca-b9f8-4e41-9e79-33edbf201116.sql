CREATE TABLE public.lembretes_manutencao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'manutencao',
  veiculo_id uuid,
  veiculo_placa text,
  intervalo_dias integer NOT NULL DEFAULT 30,
  ultima_execucao date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lembretes_manutencao TO authenticated;
GRANT ALL ON public.lembretes_manutencao TO service_role;

ALTER TABLE public.lembretes_manutencao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage lembretes"
ON public.lembretes_manutencao FOR ALL TO authenticated
USING (organization_id = public.get_my_org())
WITH CHECK (organization_id = public.get_my_org());

CREATE TRIGGER lembretes_manutencao_updated_at
BEFORE UPDATE ON public.lembretes_manutencao
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();