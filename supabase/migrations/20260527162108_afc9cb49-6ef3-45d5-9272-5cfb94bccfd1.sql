
DROP VIEW IF EXISTS public.saldo_portaria_atual;

CREATE VIEW public.saldo_portaria_atual
WITH (security_invoker = true)
AS
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
