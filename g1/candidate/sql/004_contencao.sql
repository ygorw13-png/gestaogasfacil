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
-- Desfazer: 004_contencao_desfazer.sql (devolve só as ações controladas do entregador).

REVOKE EXECUTE ON FUNCTION public.entregador_aceitar_entrega(uuid), public.entregador_recusar_entrega(uuid,text),
  public.entregador_concluir_entrega(uuid,text,integer,text),
  public.entregador_venda_rua(uuid,text,text,text,integer,numeric,text,text,integer,integer,text,text) FROM authenticated;

-- Garantia explícita: nenhuma política de gravação direta de pedido para entregador.
-- (remove as políticas que o 003_contencao criava, caso tenha sido aplicado por engano)
DROP POLICY IF EXISTS "g1 contencao entregador le pedidos" ON public.orders;
DROP POLICY IF EXISTS "g1 contencao entregador atualiza entrega" ON public.orders;
DROP POLICY IF EXISTS "g1 contencao entregador venda rua" ON public.orders;
DROP POLICY IF EXISTS "g1 contencao entregador promissoria rua" ON public.promissory_notes;
