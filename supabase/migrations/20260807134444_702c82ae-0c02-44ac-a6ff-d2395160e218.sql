-- 1. Pontos de revenda
CREATE TABLE public.pontos_revenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  nome text NOT NULL,
  povoado text,
  telefone text,
  vasilhames_emprestados integer NOT NULL DEFAULT 0,
  media_botijoes integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pontos_revenda TO authenticated;
GRANT ALL ON public.pontos_revenda TO service_role;
ALTER TABLE public.pontos_revenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage pontos_revenda" ON public.pontos_revenda
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE TRIGGER pontos_revenda_updated_at BEFORE UPDATE ON public.pontos_revenda
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Conta de botijoes (agregados e pontos)
CREATE TABLE public.conta_botijoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  parceiro_tipo text NOT NULL CHECK (parceiro_tipo IN ('agregado','ponto')),
  parceiro_id uuid NOT NULL,
  parceiro_nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrega','pagamento','ajuste')),
  produto text NOT NULL DEFAULT 'P13',
  quantidade integer NOT NULL DEFAULT 0,
  vasilhames_recebidos integer NOT NULL DEFAULT 0,
  preco_unitario numeric,
  valor_total numeric,
  forma_pagamento text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  rota_id uuid,
  order_id uuid,
  observacoes text,
  registrado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conta_botijoes TO authenticated;
GRANT ALL ON public.conta_botijoes TO service_role;
ALTER TABLE public.conta_botijoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage conta_botijoes" ON public.conta_botijoes
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE INDEX idx_conta_botijoes_parceiro ON public.conta_botijoes(parceiro_tipo, parceiro_id, data DESC);

-- 3. Pontos atendidos por rota
CREATE TABLE public.rota_pontos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  rota_id uuid NOT NULL REFERENCES public.rotas(id) ON DELETE CASCADE,
  ponto_id uuid NOT NULL REFERENCES public.pontos_revenda(id) ON DELETE CASCADE,
  ponto_nome text NOT NULL,
  cheios_entregues integer NOT NULL DEFAULT 0,
  vasilhames_recolhidos integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rota_pontos TO authenticated;
GRANT ALL ON public.rota_pontos TO service_role;
ALTER TABLE public.rota_pontos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage rota_pontos" ON public.rota_pontos
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- 4. Conferencia diaria do administrador
CREATE TABLE public.conferencias_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  estoque_ok boolean NOT NULL DEFAULT false,
  estoque_observacao text,
  caixa_ok boolean NOT NULL DEFAULT false,
  caixa_observacao text,
  rotas_ok boolean NOT NULL DEFAULT false,
  rotas_observacao text,
  conferido_por uuid DEFAULT auth.uid(),
  conferido_por_nome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, data)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conferencias_diarias TO authenticated;
GRANT ALL ON public.conferencias_diarias TO service_role;
ALTER TABLE public.conferencias_diarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage conferencias_diarias" ON public.conferencias_diarias
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE TRIGGER conferencias_diarias_updated_at BEFORE UPDATE ON public.conferencias_diarias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Despesas: responsavel (colaborador/entregador)
ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS colaborador_id uuid,
  ADD COLUMN IF NOT EXISTS colaborador_nome text;