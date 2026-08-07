CREATE TABLE public.comissao_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org() UNIQUE,
  ativo boolean NOT NULL DEFAULT false,
  ciclo text NOT NULL DEFAULT 'quinzenal',
  pagar_promissoria_no_recebimento boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comissao_regras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  colaborador_id uuid,
  colaborador_nome text NOT NULL,
  user_id uuid,
  modo text NOT NULL DEFAULT 'percentual',
  perc_dinheiro numeric NOT NULL DEFAULT 0,
  perc_pix numeric NOT NULL DEFAULT 0,
  perc_cartao numeric NOT NULL DEFAULT 0,
  perc_promissoria numeric NOT NULL DEFAULT 0,
  fixo_por_botijao numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comissao_bonus_faixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  valor_min_recebido numeric NOT NULL,
  bonus numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comissao_fechamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  colaborador_nome text NOT NULL,
  user_id uuid,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  total_vendido numeric NOT NULL DEFAULT 0,
  total_comissao numeric NOT NULL DEFAULT 0,
  total_bonus numeric NOT NULL DEFAULT 0,
  total_pagar numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'fechado',
  pago_em timestamptz,
  observacoes text,
  detalhes jsonb,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comissao_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comissao_regras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comissao_bonus_faixas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comissao_fechamentos TO authenticated;
GRANT ALL ON public.comissao_config TO service_role;
GRANT ALL ON public.comissao_regras TO service_role;
GRANT ALL ON public.comissao_bonus_faixas TO service_role;
GRANT ALL ON public.comissao_fechamentos TO service_role;

ALTER TABLE public.comissao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissao_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissao_bonus_faixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissao_fechamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage comissao_config" ON public.comissao_config
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());
CREATE POLICY "org members manage comissao_regras" ON public.comissao_regras
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());
CREATE POLICY "org members manage comissao_bonus_faixas" ON public.comissao_bonus_faixas
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());
CREATE POLICY "org members manage comissao_fechamentos" ON public.comissao_fechamentos
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org()) WITH CHECK (organization_id = public.get_my_org());

CREATE TRIGGER comissao_config_updated_at BEFORE UPDATE ON public.comissao_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER comissao_regras_updated_at BEFORE UPDATE ON public.comissao_regras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER comissao_fechamentos_updated_at BEFORE UPDATE ON public.comissao_fechamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();