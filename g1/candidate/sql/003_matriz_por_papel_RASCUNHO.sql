-- G1 Etapa 2 — RASCUNHO PARA REVISÃO. NÃO APLICAR (nem no draft, nem em produção).
-- Aguarda a decisão 15 (matriz de papéis) em g1/DECISOES_OPERACIONAIS.md.
-- Usa somente os papéis existentes (admin, user, entregador). Não cria gerente/portaria
-- e não muda o significado de 'user': cada bloco abaixo corresponde a UMA linha da matriz
-- proposta e só deve ser mantido se o proprietário confirmar essa linha.
-- Pressupõe 002_isolamento_inativos.sql (get_my_org/has_role já exigem conta ativa).
-- Validado apenas quanto à sintaxe no banco descartável (aplicado e desfeito); NÃO há
-- teste funcional de permissão por papel, porque as regras ainda não foram decididas.

CREATE OR REPLACE FUNCTION public.g1_papel()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.role::text FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
   WHERE r.user_id = auth.uid() AND p.ativo IS TRUE
   LIMIT 1
$$;

-- Linha 15.a "Vendas/pedidos: ver e criar — admin ✔ user ✔ entregador só as próprias"
-- PENDENTE TÉCNICO: o vínculo do entregador com o pedido é o NOME (orders.delivery_person),
-- não um identificador. Sem decisão + coluna de vínculo, "só as próprias" é frágil
-- (homônimos, renomeação). Abaixo, a forma por nome, só para revisão.
DROP POLICY IF EXISTS "org members access orders" ON public.orders;
CREATE POLICY "orders select por papel" ON public.orders FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND (
    public.g1_papel() IN ('admin','user')
    OR (public.g1_papel() = 'entregador' AND (
          user_id = auth.uid()
          OR delivery_person = (SELECT name FROM public.profiles WHERE id = auth.uid())))));
CREATE POLICY "orders insert por papel" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_my_org() AND public.g1_papel() IN ('admin','user','entregador'));
-- Linha 15.b "Editar/cancelar venda — admin ✔ user ✔ entregador ✘"
-- ATENÇÃO: hoje o entregador ATUALIZA o pedido ao aceitar/entregar/receber. Se esta linha
-- for confirmada como está, o app do entregador para de funcionar; é preciso decidir se
-- "atualizar status da própria entrega" é permitido (proposta abaixo) ou se passa por função.
CREATE POLICY "orders update por papel" ON public.orders FOR UPDATE TO authenticated
  USING (organization_id = public.get_my_org() AND (
    public.g1_papel() IN ('admin','user')
    OR (public.g1_papel() = 'entregador'
        AND delivery_person = (SELECT name FROM public.profiles WHERE id = auth.uid()))))
  WITH CHECK (organization_id = public.get_my_org());
-- Linha 15.g "Excluir registros históricos — só admin"
CREATE POLICY "orders delete admin" ON public.orders FOR DELETE TO authenticated
  USING (organization_id = public.get_my_org() AND public.g1_papel() = 'admin');

-- Linhas 15.c/15.e "Caixa e estoque/portaria — admin ✔ user ✔ entregador ✘"
-- Linha 15.f "Comissões, frota, configurações, colaboradores — só admin"
-- Linha 15.g "Excluir — só admin" (aplicada a todas as tabelas abaixo)
DO $$
DECLARE
  t text;
  caixa_estoque text[] := ARRAY['fechamentos_caixa','despesas','movimentacoes_portaria',
    'acertos_entregador','trocas_cheque','conferencias_diarias','tarefas_mensais',
    'requisicoes_estoque','cascos_emprestados','conta_botijoes','rotas','rota_pontos',
    'pontos_revenda','resellers','clients','contatos_recompra','templates_mensagem','whatsapp_mensagens'];
  so_admin text[] := ARRAY['comissao_config','comissao_regras','comissao_bonus_faixas',
    'comissao_fechamentos','vehicles','vehicle_assignments','vehicle_expenses','vehicle_fuels',
    'vehicle_maintenances','lembretes_manutencao','configuracoes_entrega','configuracoes_estoque',
    'configuracoes_financeiras','configuracoes_notificacoes','configuracoes_seguranca',
    'configuracoes_sistema','colaboradores'];
  pol record;
BEGIN
  FOREACH t IN ARRAY caixa_estoque || so_admin LOOP
    FOR pol IN SELECT polname FROM pg_policy WHERE polrelid = format('public.%I', t)::regclass LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.polname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "g1 delete admin" ON public.%I FOR DELETE TO authenticated
      USING (organization_id = public.get_my_org() AND public.g1_papel() = ''admin'')', t);
  END LOOP;
  FOREACH t IN ARRAY caixa_estoque LOOP
    -- PENDENTE: entregador hoje lê clientes e grava em clients/conta_botijoes/rotas pelo app
    -- (cadastro na rua, venda na rua). Confirmar se 'entregador' entra aqui ou não.
    EXECUTE format('CREATE POLICY "g1 select" ON public.%I FOR SELECT TO authenticated
      USING (organization_id = public.get_my_org() AND public.g1_papel() IN (''admin'',''user''))', t);
    EXECUTE format('CREATE POLICY "g1 insert" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_my_org() AND public.g1_papel() IN (''admin'',''user''))', t);
    EXECUTE format('CREATE POLICY "g1 update" ON public.%I FOR UPDATE TO authenticated
      USING (organization_id = public.get_my_org() AND public.g1_papel() IN (''admin'',''user''))
      WITH CHECK (organization_id = public.get_my_org())', t);
  END LOOP;
  FOREACH t IN ARRAY so_admin LOOP
    -- PENDENTE: leitura de configurações (taxa de entrega, estoque mínimo) é usada por
    -- telas de user/entregador; decidir se leitura fica liberada para todos os papéis.
    EXECUTE format('CREATE POLICY "g1 admin" ON public.%I FOR ALL TO authenticated
      USING (organization_id = public.get_my_org() AND public.g1_papel() = ''admin'')
      WITH CHECK (organization_id = public.get_my_org() AND public.g1_papel() = ''admin'')', t);
  END LOOP;
END $$;

-- Linha 15.d "Promissórias: criar/receber — admin ✔ user ✔ entregador só criar"
DROP POLICY IF EXISTS "org access promissory_notes" ON public.promissory_notes;
CREATE POLICY "promissory select" ON public.promissory_notes FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND (public.g1_papel() IN ('admin','user') OR created_by = auth.uid()));
CREATE POLICY "promissory insert" ON public.promissory_notes FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_my_org() AND public.g1_papel() IN ('admin','user','entregador'));
CREATE POLICY "promissory update" ON public.promissory_notes FOR UPDATE TO authenticated
  USING (organization_id = public.get_my_org() AND public.g1_papel() IN ('admin','user'))
  WITH CHECK (organization_id = public.get_my_org());
CREATE POLICY "promissory delete admin" ON public.promissory_notes FOR DELETE TO authenticated
  USING (organization_id = public.get_my_org() AND public.g1_papel() = 'admin');
