-- G1 — 004 CONTENÇÃO (substitui 003_contencao.sql, que fica só para laboratório).
-- Uso: SOMENTE se o app novo do entregador falhar em produção depois do 003+004.
-- Por que mudou: o 003_contencao devolvia ao entregador a atualização direta de pedidos e a venda na rua
-- direta. Com a carga e os recebimentos em vigor, isso criaria entregas concluídas SEM baixa de carga,
-- SEM recebimento e SEM promissória — exatamente a inconsistência que queremos evitar.
--
-- Esta contenção NÃO reabre nenhuma gravação direta. Ela pausa as ações do entregador e mantém a
-- operação pela portaria, que conclui a entrega pela ação controlada (consome a carga do entregador
-- atribuído, registra recebimento/promissória/divergência). Permissões, isolamento, bloqueio de inativos,
-- carga, dívidas e recebimentos continuam íntegros.
-- Desfazer: reaplicar 004_integracao_telas.sql (devolve os GRANTs) ou o bloco GRANT no fim do 003.

REVOKE EXECUTE ON FUNCTION public.entregador_aceitar_entrega(uuid), public.entregador_recusar_entrega(uuid,text),
  public.entregador_concluir_entrega(uuid,text,integer,text),
  public.entregador_venda_rua(uuid,text,text,text,integer,numeric,text,text,integer,integer,text,text) FROM authenticated;

-- Garantia explícita: nenhuma política de gravação direta de pedido para entregador.
DROP POLICY IF EXISTS "g1c entregador le pedidos da empresa" ON public.orders;
DROP POLICY IF EXISTS "g1c entregador atualiza status" ON public.orders;
DROP POLICY IF EXISTS "g1c entregador venda rua" ON public.orders;
