
-- Tabela de movimentações de estoque da portaria
CREATE TABLE public.movimentacoes_portaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'abertura',
    'transferencia_patio_para_portaria',
    'transferencia_portaria_para_patio',
    'venda',
    'venda_comodato',
    'devolucao_vasilhame',
    'fechamento',
    'ajuste'
  )),
  produto TEXT NOT NULL CHECK (produto IN ('P13','P20','P45','agua')),
  delta_cheios INTEGER NOT NULL DEFAULT 0,
  delta_vazios INTEGER NOT NULL DEFAULT 0,
  delta_emprestados INTEGER NOT NULL DEFAULT 0,
  cliente_id UUID,
  cliente_nome TEXT,
  referencia_id UUID,
  observacoes TEXT,
  registrado_por UUID NOT NULL,
  registrado_por_nome TEXT,
  data_operacao DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mov_portaria_org_data ON public.movimentacoes_portaria(organization_id, data_operacao);
CREATE INDEX idx_mov_portaria_produto ON public.movimentacoes_portaria(produto);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_portaria TO authenticated;
GRANT ALL ON public.movimentacoes_portaria TO service_role;

ALTER TABLE public.movimentacoes_portaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org access movimentacoes_portaria"
ON public.movimentacoes_portaria
FOR ALL
TO authenticated
USING (organization_id = public.get_my_org())
WITH CHECK (organization_id = public.get_my_org());

-- View de saldo agregado por produto (do dia)
CREATE OR REPLACE VIEW public.saldo_portaria_atual AS
SELECT
  organization_id,
  data_operacao,
  produto,
  COALESCE(SUM(delta_cheios), 0)::INTEGER AS cheios,
  COALESCE(SUM(delta_vazios), 0)::INTEGER AS vazios,
  COALESCE(SUM(delta_emprestados), 0)::INTEGER AS emprestados,
  COALESCE(SUM(CASE WHEN tipo = 'devolucao_vasilhame' THEN delta_vazios ELSE 0 END), 0)::INTEGER AS devolucoes_dia,
  COALESCE(SUM(CASE WHEN tipo IN ('venda','venda_comodato') THEN -delta_cheios ELSE 0 END), 0)::INTEGER AS vendas_dia
FROM public.movimentacoes_portaria
GROUP BY organization_id, data_operacao, produto;

GRANT SELECT ON public.saldo_portaria_atual TO authenticated;
GRANT SELECT ON public.saldo_portaria_atual TO service_role;

-- Função helper para registrar movimentação (com defaults de org/user)
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_portaria(
  _tipo TEXT,
  _produto TEXT,
  _delta_cheios INTEGER,
  _delta_vazios INTEGER,
  _delta_emprestados INTEGER,
  _cliente_id UUID DEFAULT NULL,
  _cliente_nome TEXT DEFAULT NULL,
  _referencia_id UUID DEFAULT NULL,
  _observacoes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
  _user_name TEXT;
BEGIN
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(
    organization_id, tipo, produto,
    delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes,
    registrado_por, registrado_por_nome
  ) VALUES (
    public.get_my_org(), _tipo, _produto,
    _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes,
    auth.uid(), _user_name
  ) RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_portaria(TEXT,TEXT,INTEGER,INTEGER,INTEGER,UUID,TEXT,UUID,TEXT) TO authenticated;
