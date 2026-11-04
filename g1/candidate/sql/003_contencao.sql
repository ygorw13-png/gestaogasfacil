-- G1 — CONTENÇÃO do 003 (uso em produção se o app do entregador parar depois do 003).
-- NÃO é rollback: não restaura nenhuma vulnerabilidade anterior.
-- Mantém: isolamento entre empresas, bloqueio de inativos, sem exclusão definitiva,
--         guardas de preço/cancelamento/estorno, gestão só admin, configurações só admin,
--         ações controladas de carga e recebimento.
-- Afrouxa apenas: o entregador volta a ler os pedidos da empresa e a atualizar
-- status/entrega diretamente (como o app publicado faz hoje), ainda sem mexer em preço,
-- quantidade, cancelamento ou pedido concluído (trigger do 003 continua ativa),
-- e volta a inserir venda na rua diretamente (vinculada a ele mesmo).
-- Reversível reaplicando 003_permissoes_carga.sql.

DROP POLICY IF EXISTS "g1 contencao entregador le pedidos" ON public.orders;
DROP POLICY IF EXISTS "g1 contencao entregador atualiza entrega" ON public.orders;
DROP POLICY IF EXISTS "g1 contencao entregador venda rua" ON public.orders;
DROP POLICY IF EXISTS "g1 contencao entregador promissoria rua" ON public.promissory_notes;

CREATE POLICY "g1 contencao entregador le pedidos" ON public.orders FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador());
CREATE POLICY "g1 contencao entregador atualiza entrega" ON public.orders FOR UPDATE TO authenticated
  USING (organization_id = get_my_org() AND is_entregador())
  WITH CHECK (organization_id = get_my_org() AND is_entregador());
CREATE POLICY "g1 contencao entregador venda rua" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_my_org() AND is_entregador() AND user_id = auth.uid() AND origem_venda = 'rua');
CREATE POLICY "g1 contencao entregador promissoria rua" ON public.promissory_notes FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_my_org() AND is_entregador() AND created_by = auth.uid() AND status = 'pending');
