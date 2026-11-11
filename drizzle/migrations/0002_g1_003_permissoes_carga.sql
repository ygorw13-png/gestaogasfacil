-- G1 — 003 CANDIDATO: matriz por papel (decisão 15 aprovada em 04/11/2026),
-- modelo de carga do entregador (decisão 1), venda a prazo (decisão 11).
-- NÃO aplicar em produção sem aprovação explícita. Pressupõe G0.1 001 + G1 002.
-- Papéis: somente admin, user (operador) e entregador. Nada novo.
-- Executar com psql -1 (transação única). Idempotente.
--
-- Pendências NÃO decididas e por isso NÃO liberadas aqui:
--   * operador: cancelar pedido, alterar preço, estornar  -> bloqueados (só admin, por ação com motivo)
--   * reserva de estoque, destino do PIX, periodicidade do acerto, efeitos do cancelamento
--     em estoque/caixa -> não implementados (cancelamento por admin só muda status + auditoria)

-- ───────────── 1. Papéis (contas ativas; has_role do 002 já exige ativo) ─────────────
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT public.has_role(auth.uid(),'admin') $$;
CREATE OR REPLACE FUNCTION public.is_operador() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'user') $$;
CREATE OR REPLACE FUNCTION public.is_entregador() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT public.has_role(auth.uid(),'entregador') $$;

-- Contexto obrigatório para toda ação controlada: conta ativa, com empresa.
CREATE OR REPLACE FUNCTION public._ctx_org() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid; BEGIN
  o := public.get_my_org();
  IF auth.uid() IS NULL OR o IS NULL THEN RAISE EXCEPTION 'Conta inativa ou sem empresa' USING ERRCODE='42501'; END IF;
  RETURN o; END $$;

-- ───────────── 2. Estrutura nova (aditiva) ─────────────
-- Vínculo do entregador por ID. Sem preenchimento automático por nome nos registros antigos.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_person_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS carga_id uuid;
ALTER TABLE public.promissory_notes ADD COLUMN IF NOT EXISTS order_id uuid;
CREATE INDEX IF NOT EXISTS orders_delivery_person_id_idx ON public.orders(delivery_person_id);

CREATE TABLE IF NOT EXISTS public.cargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  entregador_id uuid NOT NULL,
  data date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bahia')::date,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','encerrada')),
  criado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  encerrado_em timestamptz
);
-- Uma carga aberta por entregador.
CREATE UNIQUE INDEX IF NOT EXISTS cargas_uma_aberta ON public.cargas(organization_id, entregador_id) WHERE status='aberta';

-- Livro de movimentos da carga: saldo = soma. Nunca alterado nem apagado.
CREATE TABLE IF NOT EXISTS public.carga_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  carga_id uuid NOT NULL REFERENCES public.cargas(id),
  tipo text NOT NULL CHECK (tipo IN ('saida_portaria','consumo_entrega','consumo_venda_rua','devolucao')),
  produto text NOT NULL,
  delta_cheios integer NOT NULL DEFAULT 0,
  delta_vazios integer NOT NULL DEFAULT 0,
  delta_emprestados integer NOT NULL DEFAULT 0,
  order_id uuid,
  registrado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Recebimentos efetivos (dinheiro/PIX/cartão). Fiado não gera linha aqui.
CREATE TABLE IF NOT EXISTS public.recebimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  origem text NOT NULL CHECK (origem IN ('venda','entrega','venda_rua','promissoria')),
  order_id uuid,
  promissory_id uuid,
  valor numeric NOT NULL CHECK (valor > 0),
  forma text NOT NULL CHECK (forma IN ('dinheiro','pix','cartao','outros')),
  recebido_por uuid NOT NULL,
  acerto_id uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Proteção contra reenvio (fila offline, duplo toque): uma chave = um resultado.
CREATE TABLE IF NOT EXISTS public.acoes_idempotentes (
  organization_id uuid NOT NULL,
  chave text NOT NULL,
  acao text NOT NULL,
  resultado uuid,
  usuario uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, chave)
);

-- Histórico de correções administrativas.
CREATE TABLE IF NOT EXISTS public.auditoria_correcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  tabela text NOT NULL,
  registro_id uuid NOT NULL,
  antes jsonb NOT NULL,
  depois jsonb NOT NULL,
  motivo text NOT NULL,
  feito_por uuid NOT NULL,
  feito_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cargas, public.carga_movimentos, public.recebimentos, public.auditoria_correcoes TO authenticated;
GRANT ALL ON public.cargas, public.carga_movimentos, public.recebimentos, public.acoes_idempotentes, public.auditoria_correcoes TO service_role;
REVOKE ALL ON public.acoes_idempotentes FROM authenticated;
ALTER TABLE public.cargas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carga_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes_idempotentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_correcoes ENABLE ROW LEVEL SECURITY;

-- Tipos de movimentação da portaria para a carga (transferência, não venda).
ALTER TABLE public.movimentacoes_portaria DROP CONSTRAINT IF EXISTS movimentacoes_portaria_tipo_check;
ALTER TABLE public.movimentacoes_portaria ADD CONSTRAINT movimentacoes_portaria_tipo_check CHECK (tipo = ANY (ARRAY['abertura','transferencia_patio_para_portaria',
  'transferencia_portaria_para_patio','venda','venda_comodato','devolucao_vasilhame','fechamento','ajuste','sangria_despesa','entrada_patio','ajuste_patio',
  'saida_carga','retorno_carga']));

-- ───────────── 3. Políticas por papel ─────────────
-- Remove todas as políticas atuais das tabelas tratadas e recria por comando.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN (
    'orders','clients','colaboradores','promissory_notes','movimentacoes_portaria','fechamentos_caixa','despesas',
    'acertos_entregador','cascos_emprestados','conta_botijoes','rotas','rota_pontos','pontos_revenda','resellers',
    'requisicoes_estoque','contatos_recompra','conferencias_diarias','trocas_cheque','whatsapp_mensagens',
    'configuracoes_entrega','configuracoes_estoque','configuracoes_financeiras','configuracoes_sistema',
    'configuracoes_notificacoes','configuracoes_seguranca',
    'comissao_bonus_faixas','comissao_config','comissao_fechamentos','comissao_regras',
    'vehicles','vehicle_assignments','vehicle_expenses','vehicle_fuels','vehicle_maintenances',
    'lembretes_manutencao','tarefas_mensais','templates_mensagem',
    'cargas','carga_movimentos','recebimentos','auditoria_correcoes')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename); END LOOP; END $$;

-- 3a. Operacionais (admin + operador): ler, criar, alterar. Ninguém apaga.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['orders','clients','promissory_notes','despesas','acertos_entregador','cascos_emprestados',
    'conta_botijoes','rotas','rota_pontos','pontos_revenda','resellers','requisicoes_estoque','contatos_recompra',
    'conferencias_diarias','trocas_cheque','whatsapp_mensagens'] LOOP
    EXECUTE format('CREATE POLICY "g1 operador le" ON public.%I FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador())', t);
    EXECUTE format('CREATE POLICY "g1 operador cria" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org() AND is_operador())', t);
    EXECUTE format('CREATE POLICY "g1 operador altera" ON public.%I FOR UPDATE TO authenticated USING (organization_id = get_my_org() AND is_operador()) WITH CHECK (organization_id = get_my_org() AND is_operador())', t);
  END LOOP; END $$;

-- 3b. Históricos imutáveis (só leitura direta; gravação por funções controladas).
--     Portaria: o operador continua registrando por registrar_movimentacao_portaria.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['movimentacoes_portaria','carga_movimentos','recebimentos'] LOOP
    EXECUTE format('CREATE POLICY "g1 operador le" ON public.%I FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador())', t);
  END LOOP; END $$;
CREATE POLICY "g1 operador le" ON public.cargas FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador());
CREATE POLICY "g1 admin le" ON public.auditoria_correcoes FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_admin());

-- Fechamento de caixa: operador abre/fecha (cria e lê); correção só por ação de admin.
CREATE POLICY "g1 operador le" ON public.fechamentos_caixa FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador());
CREATE POLICY "g1 operador cria" ON public.fechamentos_caixa FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org() AND is_operador());

-- 3c. Entregador: apenas o que é dele, só leitura direta.
CREATE POLICY "g1 entregador le suas entregas" ON public.orders FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador() AND delivery_person_id = auth.uid());
CREATE POLICY "g1 entregador le clientes" ON public.clients FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador());
CREATE POLICY "g1 entregador cadastro rapido" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_my_org() AND is_entregador());
CREATE POLICY "g1 entregador le sua carga" ON public.cargas FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador() AND entregador_id = auth.uid());
CREATE POLICY "g1 entregador le movimentos da sua carga" ON public.carga_movimentos FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador() AND EXISTS (SELECT 1 FROM public.cargas c WHERE c.id = carga_id AND c.entregador_id = auth.uid()));
CREATE POLICY "g1 entregador le seus recebimentos" ON public.recebimentos FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador() AND recebido_por = auth.uid());
CREATE POLICY "g1 entregador le seus acertos" ON public.acertos_entregador FOR SELECT TO authenticated
  USING (organization_id = get_my_org() AND is_entregador() AND entregador_id = auth.uid());

-- 3d. Configurações: leitura do necessário; alteração só admin.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['configuracoes_entrega','configuracoes_estoque','configuracoes_financeiras','configuracoes_sistema',
                           'configuracoes_notificacoes','configuracoes_seguranca'] LOOP
    EXECUTE format('CREATE POLICY "g1 admin cria" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org() AND is_admin())', t);
    EXECUTE format('CREATE POLICY "g1 admin altera" ON public.%I FOR UPDATE TO authenticated USING (organization_id = get_my_org() AND is_admin()) WITH CHECK (organization_id = get_my_org() AND is_admin())', t);
  END LOOP; END $$;
CREATE POLICY "g1 le cfg operacional" ON public.configuracoes_entrega FOR SELECT TO authenticated USING (organization_id = get_my_org() AND (is_operador() OR is_entregador()));
CREATE POLICY "g1 le cfg operacional" ON public.configuracoes_sistema FOR SELECT TO authenticated USING (organization_id = get_my_org() AND (is_operador() OR is_entregador()));
CREATE POLICY "g1 le cfg operacional" ON public.configuracoes_estoque FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador());
CREATE POLICY "g1 le cfg operacional" ON public.configuracoes_financeiras FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador());
CREATE POLICY "g1 admin le" ON public.configuracoes_notificacoes FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_admin());
CREATE POLICY "g1 admin le" ON public.configuracoes_seguranca FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_admin());

-- 3e. Gestão (só admin): ler, criar, alterar. Sem exclusão definitiva.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['colaboradores','comissao_bonus_faixas','comissao_config','comissao_fechamentos','comissao_regras',
    'vehicles','vehicle_assignments','vehicle_expenses','vehicle_fuels','vehicle_maintenances',
    'lembretes_manutencao','tarefas_mensais','templates_mensagem'] LOOP
    EXECUTE format('CREATE POLICY "g1 admin le" ON public.%I FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_admin())', t);
    EXECUTE format('CREATE POLICY "g1 admin cria" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id = get_my_org() AND is_admin())', t);
    EXECUTE format('CREATE POLICY "g1 admin altera" ON public.%I FOR UPDATE TO authenticated USING (organization_id = get_my_org() AND is_admin()) WITH CHECK (organization_id = get_my_org() AND is_admin())', t);
  END LOOP; END $$;
-- Exceção de leitura: colaboradores (ver 4a) e vínculos de veículo/comissão ficam só admin.

-- ───────────── 4. Guardas em gravação direta ─────────────
-- 4a. Pedidos: preço, status cancelado, empresa, autor e vínculos não mudam por UPDATE direto.
CREATE OR REPLACE FUNCTION public.orders_guard_direct_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ BEGIN
  IF coalesce(current_setting('g1.acao_controlada', true), '') = 'on' THEN RETURN NEW; END IF;
  IF NEW.price IS DISTINCT FROM OLD.price OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.carga_id IS DISTINCT FROM OLD.carga_id
     OR (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
     OR (OLD.status IN ('completed','delivered','cancelled') AND NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Alteração de preço, quantidade, cancelamento ou estorno exige ação autorizada' USING ERRCODE='42501';
  END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS orders_guard_direct_update ON public.orders;
CREATE TRIGGER orders_guard_direct_update BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_guard_direct_update();

-- Novos pedidos por gravação direta não nascem cancelados nem vinculados a carga.
CREATE OR REPLACE FUNCTION public.orders_guard_direct_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ BEGIN
  IF coalesce(current_setting('g1.acao_controlada', true), '') = 'on' THEN RETURN NEW; END IF;
  IF NEW.carga_id IS NOT NULL OR NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Pedido com carga ou cancelado só por ação autorizada' USING ERRCODE='42501'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS orders_guard_direct_insert ON public.orders;
CREATE TRIGGER orders_guard_direct_insert BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_guard_direct_insert();

-- 4b. Promissória: valor, pago e status pago só por recebimento controlado.
CREATE OR REPLACE FUNCTION public.promissory_guard_direct_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ BEGIN
  IF coalesce(current_setting('g1.acao_controlada', true), '') = 'on' THEN RETURN NEW; END IF;
  IF NEW.value IS DISTINCT FROM OLD.value OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.order_id IS DISTINCT FROM OLD.order_id
     OR (NEW.status IN ('paid','parcial','cancelled') AND NEW.status IS DISTINCT FROM OLD.status)
     OR (OLD.status IN ('paid','parcial') AND NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Recebimento ou correção de promissória só por ação autorizada' USING ERRCODE='42501';
  END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS promissory_guard_direct_update ON public.promissory_notes;
CREATE TRIGGER promissory_guard_direct_update BEFORE UPDATE ON public.promissory_notes FOR EACH ROW EXECUTE FUNCTION public.promissory_guard_direct_update();

-- ───────────── 5. Ações controladas ─────────────
-- Reenvio: devolve o resultado anterior da mesma chave (NULL = primeira vez).
CREATE OR REPLACE FUNCTION public._reenvio(_org uuid, _chave text, _acao text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE r record; BEGIN
  IF _chave IS NULL OR length(_chave) < 8 THEN RAISE EXCEPTION 'Chave de envio obrigatória'; END IF;
  INSERT INTO public.acoes_idempotentes(organization_id, chave, acao, usuario) VALUES (_org, _chave, _acao, auth.uid())
    ON CONFLICT DO NOTHING;
  IF FOUND THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.acoes_idempotentes WHERE organization_id=_org AND chave=_chave;
  IF r.acao <> _acao OR r.usuario <> auth.uid() THEN RAISE EXCEPTION 'Chave já usada em outra ação'; END IF;
  RETURN r.resultado; END $$;
CREATE OR REPLACE FUNCTION public._reenvio_fim(_org uuid, _chave text, _res uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public
AS $$ UPDATE public.acoes_idempotentes SET resultado=_res WHERE organization_id=_org AND chave=_chave $$;

CREATE OR REPLACE FUNCTION public._saldo_carga(_carga uuid, _produto text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT coalesce(sum(delta_cheios),0)::int FROM public.carga_movimentos WHERE carga_id=_carga AND produto=_produto $$;

-- 5a. Cobradores: lista limitada (id, nome, situação) para operador.
CREATE OR REPLACE FUNCTION public.listar_cobradores() RETURNS TABLE(id uuid, nome text, situacao text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT c.id, c.nome, c.situacao FROM public.colaboradores c WHERE c.organization_id=o ORDER BY c.nome;
END $$;

-- 5b. Saída para o entregador: transfere da portaria para a carga (não é venda).
CREATE OR REPLACE FUNCTION public.carga_saida(_entregador_id uuid, _produto text, _cheios integer, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); c uuid; prev uuid;
BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _cheios IS NULL OR _cheios <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id AND r.role='entregador'
                 WHERE p.id=_entregador_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  prev := public._reenvio(o, _chave, 'carga_saida'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  INSERT INTO public.cargas(organization_id, entregador_id, criado_por) VALUES (o, _entregador_id, auth.uid())
    ON CONFLICT (organization_id, entregador_id) WHERE status='aberta' DO NOTHING;
  SELECT id INTO c FROM public.cargas WHERE organization_id=o AND entregador_id=_entregador_id AND status='aberta' FOR UPDATE;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, registrado_por)
    VALUES (o, c, 'saida_portaria', _produto, _cheios, auth.uid());
  PERFORM set_config('g1.acao_controlada','on',true);
  PERFORM public.registrar_movimentacao_portaria('saida_carga', _produto, -_cheios, 0, 0, NULL, NULL, c, 'Transferência para carga');
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, c);
  RETURN c;
END $$;

-- Consumo interno da carga do entregador (com trava da carga contra concorrência).
CREATE OR REPLACE FUNCTION public._consumir_carga(_org uuid, _entregador uuid, _produto text, _qtd integer, _vazios integer, _emprestados integer, _tipo text, _order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; BEGIN
  SELECT id INTO c FROM public.cargas WHERE organization_id=_org AND entregador_id=_entregador AND status='aberta' FOR UPDATE;
  IF c IS NULL THEN RAISE EXCEPTION 'Entregador sem carga aberta'; END IF;
  IF public._saldo_carga(c, _produto) < _qtd THEN RAISE EXCEPTION 'Carga insuficiente para %', _produto; END IF;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados, order_id, registrado_por)
    VALUES (_org, c, _tipo, _produto, -_qtd, coalesce(_vazios,0), coalesce(_emprestados,0), _order, auth.uid());
  RETURN c; END $$;

-- Registra o pagamento: dinheiro/PIX/cartão viram recebimento; promissória vira dívida ligada ao pedido.
CREATE OR REPLACE FUNCTION public._registrar_pagamento(_org uuid, _order uuid, _origem text, _forma text, _valor numeric, _cliente uuid, _cliente_nome text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
  IF _forma = 'promissoria' THEN
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Venda a prazo exige valor'; END IF;
    INSERT INTO public.promissory_notes(organization_id, client_id, client_name, value, due_date, status, created_by, order_id, notes)
      VALUES (_org, _cliente, coalesce(_cliente_nome,'Cliente'), _valor, ((now() AT TIME ZONE 'America/Bahia')::date + 30), 'pending', auth.uid(), _order, 'Venda a prazo');
  ELSIF _forma IN ('dinheiro','pix','cartao') THEN
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe o valor recebido'; END IF;
    INSERT INTO public.recebimentos(organization_id, origem, order_id, valor, forma, recebido_por) VALUES (_org, _origem, _order, _valor, _forma, auth.uid());
  ELSE RAISE EXCEPTION 'Forma de pagamento inválida';
  END IF; END $$;

-- 5c. Entregador aceita entrega atribuída a ele.
CREATE OR REPLACE FUNCTION public.entregador_aceitar_entrega(_order_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL OR r.delivery_person_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Entrega não atribuída a você' USING ERRCODE='42501'; END IF;
  IF r.status = 'delivering' THEN RETURN; END IF; -- reenvio
  IF r.status <> 'assigned' THEN RAISE EXCEPTION 'Transição inválida: % -> delivering', r.status; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='delivering', accepted_at=now() WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
END $$;

-- 5d. Entregador recusa: volta para a fila, sem vínculo.
CREATE OR REPLACE FUNCTION public.entregador_recusar_entrega(_order_id uuid, _motivo text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF coalesce(length(trim(_motivo)),0) < 3 THEN RAISE EXCEPTION 'Informe o motivo'; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL OR r.delivery_person_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Entrega não atribuída a você' USING ERRCODE='42501'; END IF;
  IF r.status NOT IN ('assigned','delivering') THEN RAISE EXCEPTION 'Transição inválida: % -> pending', r.status; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='pending', delivery_person=NULL, delivery_person_id=NULL, rejection_reason=_motivo WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
END $$;

-- 5e. Entregador conclui: consome a carga, registra pagamento. Uma vez só.
CREATE OR REPLACE FUNCTION public.entregador_concluir_entrega(_order_id uuid, _forma text, _vasilhames_recebidos integer, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; c uuid; prev uuid; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  prev := public._reenvio(o, _chave, 'concluir_entrega'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL OR r.delivery_person_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Entrega não atribuída a você' USING ERRCODE='42501'; END IF;
  IF r.status <> 'delivering' THEN RAISE EXCEPTION 'Transição inválida: % -> completed', r.status; END IF;
  IF coalesce(_vasilhames_recebidos,0) < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  c := public._consumir_carga(o, auth.uid(), r.product, coalesce(r.quantity,1), _vasilhames_recebidos, 0, 'consumo_entrega', r.id);
  PERFORM public._registrar_pagamento(o, r.id, 'entrega', _forma, r.price, r.client_id, r.client_name);
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='completed', delivered_at=now(), payment_method=_forma, carga_id=c,
    vasilhames_recebidos=coalesce(_vasilhames_recebidos,0), has_empty_cylinder=coalesce(_vasilhames_recebidos,0)>0 WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, r.id);
  RETURN r.id; END $$;

-- 5f. Venda própria na rua: cria o pedido concluído, consome a carga, registra pagamento.
CREATE OR REPLACE FUNCTION public.entregador_venda_rua(_cliente_id uuid, _cliente_nome text, _cliente_fone text, _produto text,
  _quantidade integer, _valor numeric, _forma text, _tipo_venda text, _vasilhames_entregues integer, _vasilhames_recebidos integer,
  _observacoes text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); c uuid; oid uuid; prev uuid; n text; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  prev := public._reenvio(o, _chave, 'venda_rua'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT name INTO n FROM public.profiles WHERE id=auth.uid();
  PERFORM set_config('g1.acao_controlada','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, client_name, client_phone, product, quantity, price, payment_method,
    notes, status, delivery_person, delivery_person_id, delivered_at, origem_venda, tipo_venda, vasilhames_entregues, vasilhames_recebidos, has_empty_cylinder)
  VALUES (auth.uid(), o, _cliente_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente avulso'), _cliente_fone, _produto, _quantidade, coalesce(_valor,0), _forma,
    _observacoes, 'completed', n, auth.uid(), now(), 'rua', _tipo_venda, coalesce(_vasilhames_entregues,0), coalesce(_vasilhames_recebidos,0), coalesce(_vasilhames_recebidos,0)>0)
  RETURNING id INTO oid;
  c := public._consumir_carga(o, auth.uid(), _produto, _quantidade, _vasilhames_recebidos, coalesce(_vasilhames_entregues,0), 'consumo_venda_rua', oid);
  UPDATE public.orders SET carga_id=c WHERE id=oid;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._registrar_pagamento(o, oid, 'venda_rua', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

-- 5g. Devolução de sobra: carga -> portaria. Entregador (própria carga) ou operador.
CREATE OR REPLACE FUNCTION public.carga_devolver(_carga_id uuid, _produto text, _cheios integer, _vazios integer, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); k record; prev uuid; mid uuid; BEGIN
  IF coalesce(_cheios,0) < 0 OR coalesce(_vazios,0) < 0 OR coalesce(_cheios,0)+coalesce(_vazios,0) = 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO k FROM public.cargas WHERE id=_carga_id AND organization_id=o FOR UPDATE;
  IF k.id IS NULL OR k.status <> 'aberta' THEN RAISE EXCEPTION 'Carga inexistente ou encerrada'; END IF;
  IF NOT (public.is_operador() OR (public.is_entregador() AND k.entregador_id = auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  prev := public._reenvio(o, _chave, 'carga_devolver'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  IF public._saldo_carga(_carga_id, _produto) < coalesce(_cheios,0) THEN RAISE EXCEPTION 'Devolução maior que a carga'; END IF;
  IF (SELECT coalesce(sum(delta_vazios),0) FROM public.carga_movimentos WHERE carga_id=_carga_id AND produto=_produto) < coalesce(_vazios,0) THEN
    RAISE EXCEPTION 'Vazios maiores que os recolhidos'; END IF;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, registrado_por)
    VALUES (o, _carga_id, 'devolucao', _produto, -coalesce(_cheios,0), -coalesce(_vazios,0), auth.uid()) RETURNING id INTO mid;
  PERFORM set_config('g1.acao_controlada','on',true);
  PERFORM public.registrar_movimentacao_portaria('retorno_carga', _produto, coalesce(_cheios,0), coalesce(_vazios,0), 0, NULL, NULL, _carga_id, 'Retorno de carga');
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, mid);
  RETURN mid; END $$;

-- 5h. Recebimento de promissória (parcial ou total). Não é venda nova.
CREATE OR REPLACE FUNCTION public.receber_promissoria(_id uuid, _valor numeric, _forma text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); p record; pago numeric; rid uuid; prev uuid; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _forma NOT IN ('dinheiro','pix','cartao') THEN RAISE EXCEPTION 'Forma inválida'; END IF;
  prev := public._reenvio(o, _chave, 'receber_promissoria'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO p FROM public.promissory_notes WHERE id=_id AND organization_id=o FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Promissória não encontrada'; END IF;
  IF p.status IN ('paid','cancelled') THEN RAISE EXCEPTION 'Promissória já encerrada'; END IF;
  pago := coalesce(p.paid_amount,0);
  IF _valor IS NULL OR _valor <= 0 OR _valor > p.value - pago THEN RAISE EXCEPTION 'Valor deve ser entre 0 e o saldo (%)', p.value - pago; END IF;
  INSERT INTO public.recebimentos(organization_id, origem, promissory_id, order_id, valor, forma, recebido_por)
    VALUES (o, 'promissoria', _id, p.order_id, _valor, _forma, auth.uid()) RETURNING id INTO rid;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.promissory_notes SET paid_amount = pago + _valor, payment_method=_forma,
    status = CASE WHEN pago + _valor >= p.value THEN 'paid' ELSE 'parcial' END,
    paid_at = CASE WHEN pago + _valor >= p.value THEN now() ELSE NULL END WHERE id=_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, rid);
  RETURN rid; END $$;

-- 5i. Correção administrativa de pedido: com motivo e histórico.
--     Não estorna estoque/caixa (decisão 5 pendente).
CREATE OR REPLACE FUNCTION public.admin_corrigir_pedido(_order_id uuid, _novo_preco numeric, _novo_status text, _motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; d record; aid uuid; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF coalesce(length(trim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório'; END IF;
  IF _novo_status IS NOT NULL AND _novo_status NOT IN ('pending','assigned','delivering','completed','delivered','cancelled') THEN
    RAISE EXCEPTION 'Status inválido'; END IF;
  IF _novo_preco IS NOT NULL AND _novo_preco < 0 THEN RAISE EXCEPTION 'Preço inválido'; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET price=coalesce(_novo_preco, price), status=coalesce(_novo_status, status) WHERE id=_order_id RETURNING * INTO d;
  PERFORM set_config('g1.acao_controlada','off',true);
  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'orders', _order_id, jsonb_build_object('price', r.price, 'status', r.status), jsonb_build_object('price', d.price, 'status', d.status), _motivo, auth.uid())
    RETURNING id INTO aid;
  RETURN aid; END $$;

-- 5j. Atribuição de entrega (operador) por ID do entregador.
CREATE OR REPLACE FUNCTION public.atribuir_entrega(_order_id uuid, _entregador_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; n text; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  SELECT p.name INTO n FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
    WHERE p.id=_entregador_id AND p.organization_id=o AND p.ativo;
  IF n IS NULL THEN RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF r.status NOT IN ('pending','assigned') THEN RAISE EXCEPTION 'Transição inválida: % -> assigned', r.status; END IF;
  UPDATE public.orders SET status='assigned', delivery_person=n, delivery_person_id=_entregador_id, assigned_at=now(), rejection_reason=NULL WHERE id=_order_id;
END $$;

-- 5k. Portaria: movimentação direta só por operador; tipos de carga só por ação controlada.
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_portaria(_tipo text, _produto text, _delta_cheios integer, _delta_vazios integer, _delta_emprestados integer, _cliente_id uuid DEFAULT NULL::uuid, _cliente_nome text DEFAULT NULL::text, _referencia_id uuid DEFAULT NULL::uuid, _observacoes text DEFAULT NULL::text, _data_operacao date DEFAULT CURRENT_DATE)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _id uuid; _user_name text; _org uuid := public.get_my_org(); _ctl boolean := coalesce(current_setting('g1.acao_controlada', true), '') = 'on';
BEGIN
  IF _org IS NULL THEN RAISE EXCEPTION 'Conta inativa ou sem empresa' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão para movimentar estoque' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND _tipo IN ('saida_carga','retorno_carga') THEN RAISE EXCEPTION 'Use a ação de carga' USING ERRCODE = '42501'; END IF;
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(organization_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes, registrado_por, registrado_por_nome, data_operacao)
  VALUES (_org, _tipo, _produto, _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes, auth.uid(), _user_name, _data_operacao) RETURNING id INTO _id;
  RETURN _id;
END $function$;

-- Funções internas não ficam expostas; as ações ficam só para usuários autenticados.
REVOKE ALL ON FUNCTION public._reenvio(uuid,text,text), public._reenvio_fim(uuid,text,uuid), public._saldo_carga(uuid,text),
  public._consumir_carga(uuid,uuid,text,integer,integer,integer,text,uuid),
  public._registrar_pagamento(uuid,uuid,text,text,numeric,uuid,text), public._ctx_org() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.listar_cobradores(), public.carga_saida(uuid,text,integer,text), public.entregador_aceitar_entrega(uuid),
  public.entregador_recusar_entrega(uuid,text), public.entregador_concluir_entrega(uuid,text,integer,text),
  public.entregador_venda_rua(uuid,text,text,text,integer,numeric,text,text,integer,integer,text,text),
  public.carga_devolver(uuid,text,integer,integer,text), public.receber_promissoria(uuid,numeric,text,text),
  public.admin_corrigir_pedido(uuid,numeric,text,text), public.atribuir_entrega(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_cobradores(), public.carga_saida(uuid,text,integer,text), public.entregador_aceitar_entrega(uuid),
  public.entregador_recusar_entrega(uuid,text), public.entregador_concluir_entrega(uuid,text,integer,text),
  public.entregador_venda_rua(uuid,text,text,text,integer,numeric,text,text,integer,integer,text,text),
  public.carga_devolver(uuid,text,integer,integer,text), public.receber_promissoria(uuid,numeric,text,text),
  public.admin_corrigir_pedido(uuid,numeric,text,text), public.atribuir_entrega(uuid,uuid) TO authenticated;