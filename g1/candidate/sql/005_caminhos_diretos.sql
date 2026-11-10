-- G1 — 005 CANDIDATO: fecha as gravações diretas que ainda contornavam carga, dívida e recebimento.
-- Pressupõe G0.1 001 + G1 002 + 003 + 004. NÃO aplicar em produção sem aprovação explícita.
-- Só banco descartável (g1/tests/sql/reset_com005.sh). Executar com psql -1. Idempotente.
--
-- Caminhos encontrados no lote 4 (reproduzidos como operador no banco descartável, antes desta correção):
--   H1 inserir pedido já concluído      -> venda sem baixa de estoque e sem recebimento
--   H2 concluir pedido por UPDATE       -> entrega concluída sem consumir a carga e sem recebimento
--   H3 atribuir/trocar entregador por UPDATE -> contorna a regra C (ID + motivo) e a carga
--   H4 inserir promissória já paga      -> pagamento sem recebimento registrado
--   H5 trocar forma/produto de venda concluída por UPDATE -> recebimento/estoque deixam de bater
--   H6 movimento 'venda' direto na portaria -> baixa de estoque sem pedido nem recebimento
-- Nada aqui faz estorno (decisão B pendente). Nenhuma permissão é ampliada.

CREATE OR REPLACE FUNCTION public._g1_ctl() RETURNS boolean LANGUAGE sql STABLE
AS $$ SELECT coalesce(current_setting('g1.acao_controlada', true), '') = 'on' $$;

-- ───────────── 1. Pedidos: inserção direta só nasce na fila ─────────────
CREATE OR REPLACE FUNCTION public.orders_guard_direct_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ BEGIN
  IF public._g1_ctl() THEN RETURN NEW; END IF;
  IF NEW.carga_id IS NOT NULL OR NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Pedido com carga ou cancelado só por ação autorizada' USING ERRCODE='42501'; END IF;
  IF NEW.status IN ('delivered','completed') THEN
    RAISE EXCEPTION 'Venda concluída só pela ação de venda (pedido, baixa de estoque e recebimento juntos)' USING ERRCODE='42501'; END IF;
  IF coalesce(NEW.status,'pending') <> 'pending' OR NEW.delivery_person_id IS NOT NULL OR nullif(trim(coalesce(NEW.delivery_person,'')),'') IS NOT NULL THEN
    RAISE EXCEPTION 'Pedido novo entra na fila; entregador só pela ação de atribuição (por ID)' USING ERRCODE='42501'; END IF;
  RETURN NEW; END $$;

-- ───────────── 2. Pedidos: atualização direta só em dado que não mexe em estoque/dinheiro ─────────────
CREATE OR REPLACE FUNCTION public.orders_guard_direct_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE fechado boolean := OLD.status IN ('completed','delivered','cancelled'); BEGIN
  IF public._g1_ctl() THEN RETURN NEW; END IF;
  -- regras do 003 (A)
  IF NEW.price IS DISTINCT FROM OLD.price OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.carga_id IS DISTINCT FROM OLD.carga_id
     OR (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
     OR (fechado AND NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Alteração de preço, quantidade, cancelamento ou estorno exige ação autorizada' USING ERRCODE='42501';
  END IF;
  -- H2: conclusão só pela ação (consome carga, registra recebimento/promissória)
  IF NEW.status IN ('completed','delivered') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Conclusão só pela ação de conclusão (consome a carga e registra o recebimento)' USING ERRCODE='42501'; END IF;
  -- H3: atribuição, troca e devolução à fila só pelas ações (C)
  IF NEW.delivery_person_id IS DISTINCT FROM OLD.delivery_person_id
     OR coalesce(NEW.delivery_person,'') IS DISTINCT FROM coalesce(OLD.delivery_person,'')
     OR (NEW.status IN ('assigned','pending') AND NEW.status IS DISTINCT FROM OLD.status)
     OR (NEW.status = 'delivering' AND OLD.status IS DISTINCT FROM 'assigned' AND OLD.status IS DISTINCT FROM 'delivering') THEN
    RAISE EXCEPTION 'Atribuição, troca de entregador ou devolução à fila só pela ação de atribuição/reatribuição (por ID, com motivo)' USING ERRCODE='42501'; END IF;
  -- H5: venda concluída não muda por gravação direta (só observação)
  IF fechado AND (NEW.payment_method IS DISTINCT FROM OLD.payment_method OR NEW.product IS DISTINCT FROM OLD.product
     OR NEW.tipo_venda IS DISTINCT FROM OLD.tipo_venda OR NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.client_name IS DISTINCT FROM OLD.client_name OR NEW.reseller_id IS DISTINCT FROM OLD.reseller_id
     OR NEW.vasilhames_entregues IS DISTINCT FROM OLD.vasilhames_entregues OR NEW.vasilhames_recebidos IS DISTINCT FROM OLD.vasilhames_recebidos
     OR NEW.has_empty_cylinder IS DISTINCT FROM OLD.has_empty_cylinder OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
     OR NEW.origem_venda IS DISTINCT FROM OLD.origem_venda) THEN
    RAISE EXCEPTION 'Venda concluída não muda por gravação direta; correção sem regra de estorno ainda (decisão B)' USING ERRCODE='42501'; END IF;
  -- produto já com o entregador não troca de produto
  IF OLD.carga_id IS NOT NULL AND NEW.product IS DISTINCT FROM OLD.product THEN
    RAISE EXCEPTION 'Produto já transferido para a carga não muda por gravação direta' USING ERRCODE='42501'; END IF;
  RETURN NEW; END $$;

-- ───────────── 3. Promissória: inserção direta só em aberto e sem vínculo de venda ─────────────
CREATE OR REPLACE FUNCTION public.promissory_guard_direct_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ BEGIN
  IF public._g1_ctl() THEN RETURN NEW; END IF;
  IF NEW.order_id IS NOT NULL THEN
    RAISE EXCEPTION 'Promissória de venda só pela ação da venda' USING ERRCODE='42501'; END IF;
  IF coalesce(NEW.paid_amount,0) <> 0 OR NEW.paid_at IS NOT NULL OR coalesce(NEW.status,'pending') NOT IN ('pending','assigned') THEN
    RAISE EXCEPTION 'Promissória nasce em aberto; recebimento só pela ação de recebimento' USING ERRCODE='42501'; END IF;
  IF NEW.value IS NULL OR NEW.value <= 0 THEN RAISE EXCEPTION 'Valor da promissória inválido'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS promissory_guard_direct_insert ON public.promissory_notes;
CREATE TRIGGER promissory_guard_direct_insert BEFORE INSERT ON public.promissory_notes FOR EACH ROW EXECUTE FUNCTION public.promissory_guard_direct_insert();

-- ───────────── 4. Ações que gravavam sem marcar o contexto controlado ─────────────
-- _registrar_pagamento: marca e devolve o contexto anterior (não desliga o de quem chamou).
CREATE OR REPLACE FUNCTION public._registrar_pagamento(_org uuid, _order uuid, _origem text, _forma text, _valor numeric, _cliente uuid, _cliente_nome text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE f text := public._forma_chave(_forma); antes text := coalesce(current_setting('g1.acao_controlada', true), ''); BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF f = 'promissoria' THEN
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Venda a prazo exige valor'; END IF;
    PERFORM set_config('g1.acao_controlada','on',true);
    INSERT INTO public.promissory_notes(organization_id, client_id, client_name, value, due_date, status, created_by, order_id, notes)
      VALUES (_org, _cliente, coalesce(_cliente_nome,'Cliente'), _valor, ((now() AT TIME ZONE 'America/Bahia')::date + 30), 'pending', auth.uid(), _order, 'Venda a prazo');
    PERFORM set_config('g1.acao_controlada', antes, true);
  ELSE
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe o valor recebido'; END IF;
    INSERT INTO public.recebimentos(organization_id, origem, order_id, valor, forma, recebido_por) VALUES (_org, _origem, _order, _valor, f, auth.uid());
  END IF; END $$;

-- venda_portaria: mesmo corpo do 004, com o contexto controlado em volta do pedido e da baixa.
CREATE OR REPLACE FUNCTION public.venda_portaria(_cliente_id uuid, _cliente_nome text, _produto text, _quantidade integer,
  _valor numeric, _forma text, _tipo_venda text, _devolveu_vazio boolean, _reseller_id uuid, _observacoes text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); oid uuid; prev uuid; k text := public._produto_chave(_produto); t text := coalesce(_tipo_venda,'recarga'); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Venda exige chave de reenvio'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de estoque: %', _produto; END IF;
  IF t NOT IN ('recarga','completo','vasilhame') THEN RAISE EXCEPTION 'Tipo de venda inválido'; END IF;
  IF public._forma_chave(_forma) IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  IF _reseller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.resellers WHERE id=_reseller_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Revenda de outra empresa'; END IF;
  prev := public._reenvio(o, _chave, 'venda_portaria'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, reseller_id, client_name, address, product, quantity, price, payment_method,
    status, delivered_at, origem_venda, tipo_venda, has_empty_cylinder, vasilhames_entregues, vasilhames_recebidos, notes)
  VALUES (auth.uid(), o, _cliente_id, _reseller_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente Balcão'), '{}'::jsonb, _produto, _quantidade, coalesce(_valor,0), _forma,
    'delivered', now(), 'portaria', t, coalesce(_devolveu_vazio, t='recarga'),
    CASE WHEN t='vasilhame' THEN _quantidade WHEN t='completo' THEN _quantidade ELSE 0 END,
    CASE WHEN t='recarga' THEN _quantidade ELSE 0 END, _observacoes)
  RETURNING id INTO oid;
  PERFORM public.registrar_movimentacao_portaria(CASE WHEN coalesce(_devolveu_vazio, t='recarga') THEN 'venda' ELSE 'venda_comodato' END, k,
    CASE WHEN t='vasilhame' THEN 0 ELSE -_quantidade END,
    CASE WHEN t='recarga' THEN _quantidade WHEN t='vasilhame' THEN -_quantidade ELSE 0 END,
    0, _cliente_id, _cliente_nome, oid, 'Venda na portaria');
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._registrar_pagamento(o, oid, 'venda', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

-- ───────────── 5. Portaria: baixa por venda só pela ação de venda (H6) ─────────────
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_portaria(_tipo text, _produto text, _delta_cheios integer, _delta_vazios integer, _delta_emprestados integer, _cliente_id uuid DEFAULT NULL::uuid, _cliente_nome text DEFAULT NULL::text, _referencia_id uuid DEFAULT NULL::uuid, _observacoes text DEFAULT NULL::text, _data_operacao date DEFAULT CURRENT_DATE)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _id uuid; _user_name text; _org uuid := public.get_my_org(); _ctl boolean := public._g1_ctl();
BEGIN
  IF _org IS NULL THEN RAISE EXCEPTION 'Conta inativa ou sem empresa' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão para movimentar estoque' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND _tipo IN ('saida_carga','retorno_carga') THEN RAISE EXCEPTION 'Use a ação de carga' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND _tipo IN ('venda','venda_comodato') THEN
    RAISE EXCEPTION 'Baixa por venda só pela ação de venda (pedido e recebimento juntos)' USING ERRCODE = '42501'; END IF;
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(organization_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes, registrado_por, registrado_por_nome, data_operacao)
  VALUES (_org, _tipo, _produto, _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes, auth.uid(), _user_name, _data_operacao) RETURNING id INTO _id;
  RETURN _id;
END $function$;

-- ───────────── 6. Exposição ─────────────
REVOKE ALL ON FUNCTION public._registrar_pagamento(uuid,uuid,text,text,numeric,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text) TO authenticated;
