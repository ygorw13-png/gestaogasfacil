ALTER TABLE public.movimentacoes_portaria DROP CONSTRAINT movimentacoes_portaria_tipo_check;
ALTER TABLE public.movimentacoes_portaria ADD CONSTRAINT movimentacoes_portaria_tipo_check CHECK (tipo = ANY (ARRAY['abertura','transferencia_patio_para_portaria','transferencia_portaria_para_patio','venda','venda_comodato','devolucao_vasilhame','fechamento','ajuste','sangria_despesa','entrada_patio','ajuste_patio']));

CREATE OR REPLACE VIEW public.saldo_portaria_atual AS
SELECT organization_id,
    data_operacao,
    produto,
    COALESCE(sum(delta_cheios), 0::bigint)::integer AS cheios,
    COALESCE(sum(delta_vazios), 0::bigint)::integer AS vazios,
    COALESCE(sum(delta_emprestados), 0::bigint)::integer AS emprestados,
    COALESCE(sum(CASE WHEN tipo = 'devolucao_vasilhame' THEN delta_vazios ELSE 0 END), 0::bigint)::integer AS devolucoes_dia,
    COALESCE(sum(CASE WHEN tipo = ANY (ARRAY['venda','venda_comodato']) THEN - delta_cheios ELSE 0 END), 0::bigint)::integer AS vendas_dia
FROM public.movimentacoes_portaria
WHERE tipo NOT IN ('entrada_patio','ajuste_patio')
GROUP BY organization_id, data_operacao, produto;

CREATE OR REPLACE VIEW public.saldo_patio AS
SELECT organization_id,
    produto,
    COALESCE(sum(CASE
      WHEN tipo IN ('entrada_patio','ajuste_patio') THEN delta_cheios
      WHEN tipo IN ('transferencia_patio_para_portaria','transferencia_portaria_para_patio') THEN - delta_cheios
      ELSE 0 END), 0::bigint)::integer AS cheios,
    COALESCE(sum(CASE
      WHEN tipo IN ('entrada_patio','ajuste_patio') THEN delta_vazios
      WHEN tipo IN ('transferencia_patio_para_portaria','transferencia_portaria_para_patio') THEN - delta_vazios
      ELSE 0 END), 0::bigint)::integer AS vazios
FROM public.movimentacoes_portaria
WHERE produto <> 'dinheiro'
GROUP BY organization_id, produto;

GRANT SELECT ON public.saldo_patio TO authenticated;
GRANT SELECT ON public.saldo_patio TO service_role;