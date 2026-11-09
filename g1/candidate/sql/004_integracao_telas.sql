-- G1 — 004 CANDIDATO: integração das telas com as ações controladas.
-- NÃO aplicar em produção sem aprovação explícita. Pressupõe G0.1 001 + G1 002 + G1 003.
-- Executar com psql -1 (transação única). Idempotente.
--
-- Decisões aplicadas (06/11/2026):
--   A. Operador não cancela, não altera preço, não estorna. Só admin, com motivo e auditoria.
--   C. Reatribuição explícita de pedido aberto, por ID do entregador, com motivo. Históricos não mudam.
--   D. Origem física real: produto da portaria vai para a carga ANTES do consumo (também na entrega avulsa).
--      A portaria só baixa na transferência; a entrega só baixa da carga. Nunca duas vezes.
-- Decisão B PENDENTE: nenhum estorno automático. Cancelar/reabrir venda concluída e mudar preço de venda
--   com pagamento registrado ficam BLOQUEADOS (deixariam estoque, dívida ou recebimento inconsistentes).

-- ───────────── 1. Normalização (produto e forma de pagamento) ─────────────
CREATE OR REPLACE FUNCTION public._produto_chave(_p text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN upper(coalesce(_p,'')) LIKE '%P13%' THEN 'P13'
              WHEN upper(coalesce(_p,'')) LIKE '%P20%' THEN 'P20'
              WHEN upper(coalesce(_p,'')) LIKE '%P45%' THEN 'P45'
              WHEN upper(coalesce(_p,'')) ~ '(ÁGUA|AGUA)' THEN 'agua' END $$;

-- money/credit/debit vêm das telas atuais; o recebimento grava a forma normalizada.
-- Vale-gás e formas sem regra são recusadas (não há regra de recebimento decidida).
CREATE OR REPLACE FUNCTION public._forma_chave(_f text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(_f,''))
    WHEN 'money' THEN 'dinheiro' WHEN 'dinheiro' THEN 'dinheiro' WHEN 'cash' THEN 'dinheiro'
    WHEN 'pix' THEN 'pix'
    WHEN 'credit' THEN 'cartao' WHEN 'debit' THEN 'cartao' WHEN 'card' THEN 'cartao' WHEN 'cartao' THEN 'cartao'
    WHEN 'promissoria' THEN 'promissoria' WHEN 'convenio' THEN 'promissoria' END $$;

-- ───────────── 2. Divergências de recebimento (só acrescenta) ─────────────
CREATE TABLE IF NOT EXISTS public.divergencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL,
  esperado numeric NOT NULL,
  recebido numeric NOT NULL,
  motivo text NOT NULL,
  registrado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.divergencias TO authenticated;
GRANT ALL ON public.divergencias TO service_role;
ALTER TABLE public.divergencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "g1 operador le" ON public.divergencias;
CREATE POLICY "g1 operador le" ON public.divergencias FOR SELECT TO authenticated USING (organization_id = get_my_org() AND is_operador());

-- ───────────── 3. Carga com produto normalizado ─────────────
CREATE OR REPLACE FUNCTION public._saldo_carga(_carga uuid, _produto text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT coalesce(sum(delta_cheios),0)::int FROM public.carga_movimentos WHERE carga_id=_carga AND produto=public._produto_chave(_produto) $$;

CREATE OR REPLACE FUNCTION public._consumir_carga(_org uuid, _entregador uuid, _produto text, _qtd integer, _vazios integer, _emprestados integer, _tipo text, _order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; k text := public._produto_chave(_produto); BEGIN
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', _produto; END IF;
  SELECT id INTO c FROM public.cargas WHERE organization_id=_org AND entregador_id=_entregador AND status='aberta' FOR UPDATE;
  IF c IS NULL THEN RAISE EXCEPTION 'Entregador sem carga aberta. Registre a saída da portaria para a carga antes'; END IF;
  IF public._saldo_carga(c, k) < _qtd THEN RAISE EXCEPTION 'Carga insuficiente para %. Registre a saída da portaria para a carga antes', k; END IF;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados, order_id, registrado_por)
    VALUES (_org, c, _tipo, k, -_qtd, coalesce(_vazios,0), coalesce(_emprestados,0), _order, auth.uid());
  RETURN c; END $$;

-- Transferência portaria -> carga (interna, chamada pelas ações do operador).
CREATE OR REPLACE FUNCTION public._transferir_para_carga(_org uuid, _entregador uuid, _produto text, _cheios integer, _ref_order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; k text := public._produto_chave(_produto); BEGIN
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', _produto; END IF;
  IF _cheios IS NULL OR _cheios <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  INSERT INTO public.cargas(organization_id, entregador_id, criado_por) VALUES (_org, _entregador, auth.uid())
    ON CONFLICT (organization_id, entregador_id) WHERE status='aberta' DO NOTHING;
  SELECT id INTO c FROM public.cargas WHERE organization_id=_org AND entregador_id=_entregador AND status='aberta' FOR UPDATE;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, order_id, registrado_por)
    VALUES (_org, c, 'saida_portaria', k, _cheios, _ref_order, auth.uid());
  PERFORM set_config('g1.acao_controlada','on',true);
  PERFORM public.registrar_movimentacao_portaria('saida_carga', k, -_cheios, 0, 0, NULL, NULL, c,
    CASE WHEN _ref_order IS NULL THEN 'Transferência para carga' ELSE 'Transferência para carga (entrega avulsa)' END);
  RETURN c; END $$;

CREATE OR REPLACE FUNCTION public.carga_saida(_entregador_id uuid, _produto text, _cheios integer, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); c uuid; prev uuid;
BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id AND r.role='entregador'
                 WHERE p.id=_entregador_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  prev := public._reenvio(o, _chave, 'carga_saida'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  c := public._transferir_para_carga(o, _entregador_id, _produto, _cheios, NULL);
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, c);
  RETURN c;
END $$;

-- ───────────── 4. Pagamento com forma normalizada ─────────────
CREATE OR REPLACE FUNCTION public._registrar_pagamento(_org uuid, _order uuid, _origem text, _forma text, _valor numeric, _cliente uuid, _cliente_nome text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE f text := public._forma_chave(_forma); BEGIN
  IF f IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF f = 'promissoria' THEN
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Venda a prazo exige valor'; END IF;
    INSERT INTO public.promissory_notes(organization_id, client_id, client_name, value, due_date, status, created_by, order_id, notes)
      VALUES (_org, _cliente, coalesce(_cliente_nome,'Cliente'), _valor, ((now() AT TIME ZONE 'America/Bahia')::date + 30), 'pending', auth.uid(), _order, 'Venda a prazo');
  ELSE
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe o valor recebido'; END IF;
    INSERT INTO public.recebimentos(organization_id, origem, order_id, valor, forma, recebido_por) VALUES (_org, _origem, _order, _valor, f, auth.uid());
  END IF; END $$;

-- ───────────── 5. Atribuição (C + D) ─────────────
-- Atribui pedido PENDENTE a um entregador (por ID). Reatribuir é ação separada, com motivo.
-- _retirar_da_portaria = true: entrega avulsa com produto saindo agora da portaria -> transfere para a carga
--   na mesma transação (D). Reenvio com a mesma chave não transfere de novo.
DROP FUNCTION IF EXISTS public.atribuir_entrega(uuid, uuid);
CREATE OR REPLACE FUNCTION public.atribuir_entrega(_order_id uuid, _entregador_id uuid, _retirar_da_portaria boolean DEFAULT false, _chave text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; prev uuid; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
    WHERE p.id=_entregador_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  IF _retirar_da_portaria AND _chave IS NULL THEN RAISE EXCEPTION 'Retirada da portaria exige chave de reenvio'; END IF;
  IF _chave IS NOT NULL THEN
    prev := public._reenvio(o, _chave, 'atribuir_entrega'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF r.status = 'assigned' AND r.delivery_person_id = _entregador_id AND _chave IS NULL THEN RETURN r.id; END IF; -- duplo toque
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Pedido não está na fila (%). Para trocar o entregador use a reatribuição', r.status; END IF;
  IF _retirar_da_portaria THEN
    PERFORM public._transferir_para_carga(o, _entregador_id, r.product, coalesce(r.quantity,1), r.id);
  END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='assigned', delivery_person=_entregador_id::text, delivery_person_id=_entregador_id,
    assigned_at=now(), accepted_at=NULL, rejection_reason=NULL WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  IF _chave IS NOT NULL THEN PERFORM public._reenvio_fim(o, _chave, r.id); END IF;
  RETURN r.id; END $$;

-- Reatribuição explícita de pedido ABERTO (assigned/delivering). _novo NULL = devolver para a fila.
-- Não move produto entre cargas: se o produto já está com o entregador anterior, a devolução/saída
-- de carga é registrada à parte, explicitamente. Pedidos concluídos/cancelados nunca mudam.
CREATE OR REPLACE FUNCTION public.reatribuir_entrega(_order_id uuid, _novo_entregador_id uuid, _motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; aid uuid; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF coalesce(length(trim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório'; END IF;
  IF _novo_entregador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
    WHERE p.id=_novo_entregador_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF r.status NOT IN ('assigned','delivering') THEN RAISE EXCEPTION 'Só pedidos em aberto podem ser reatribuídos (status: %)', r.status; END IF;
  IF r.delivery_person_id IS NOT DISTINCT FROM _novo_entregador_id THEN RAISE EXCEPTION 'Pedido já está com esse entregador'; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET
    status = CASE WHEN _novo_entregador_id IS NULL THEN 'pending' ELSE 'assigned' END,
    delivery_person = _novo_entregador_id::text, delivery_person_id = _novo_entregador_id,
    assigned_at = CASE WHEN _novo_entregador_id IS NULL THEN NULL ELSE now() END, accepted_at = NULL WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'orders', _order_id, jsonb_build_object('status', r.status, 'delivery_person_id', r.delivery_person_id),
      jsonb_build_object('status', CASE WHEN _novo_entregador_id IS NULL THEN 'pending' ELSE 'assigned' END, 'delivery_person_id', _novo_entregador_id),
      'Reatribuição: ' || _motivo, auth.uid()) RETURNING id INTO aid;
  RETURN aid; END $$;

-- ───────────── 6. Entregador: venda na rua grava o ID (mantém o formato das telas atuais) ─────────────
CREATE OR REPLACE FUNCTION public.entregador_venda_rua(_cliente_id uuid, _cliente_nome text, _cliente_fone text, _produto text,
  _quantidade integer, _valor numeric, _forma text, _tipo_venda text, _vasilhames_entregues integer, _vasilhames_recebidos integer,
  _observacoes text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); c uuid; oid uuid; prev uuid; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Venda na rua exige chave de reenvio'; END IF;
  IF public._forma_chave(_forma) IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  prev := public._reenvio(o, _chave, 'venda_rua'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, client_name, client_phone, product, quantity, price, payment_method,
    notes, status, delivery_person, delivery_person_id, delivered_at, origem_venda, tipo_venda, vasilhames_entregues, vasilhames_recebidos, has_empty_cylinder)
  VALUES (auth.uid(), o, _cliente_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente avulso'), _cliente_fone, _produto, _quantidade, coalesce(_valor,0), _forma,
    _observacoes, 'completed', auth.uid()::text, auth.uid(), now(), 'rua', _tipo_venda, coalesce(_vasilhames_entregues,0), coalesce(_vasilhames_recebidos,0), coalesce(_vasilhames_recebidos,0)>0)
  RETURNING id INTO oid;
  c := public._consumir_carga(o, auth.uid(), _produto, _quantidade, _vasilhames_recebidos, coalesce(_vasilhames_entregues,0), 'consumo_venda_rua', oid);
  UPDATE public.orders SET carga_id=c WHERE id=oid;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._registrar_pagamento(o, oid, 'venda_rua', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

-- ───────────── 7. Conclusão pela portaria (entregador sem app / contenção) ─────────────
-- Consome a carga do entregador ATRIBUÍDO (nunca a portaria). Valor diferente do preço vira divergência
-- registrada; o preço da venda não muda (A).
CREATE OR REPLACE FUNCTION public.operador_concluir_entrega(_order_id uuid, _forma text, _valor_recebido numeric,
  _vasilhames_recebidos integer, _motivo_divergencia text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; c uuid; prev uuid; v numeric; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Conclusão exige chave de reenvio'; END IF;
  prev := public._reenvio(o, _chave, 'operador_concluir'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF r.status NOT IN ('assigned','delivering') OR r.delivery_person_id IS NULL THEN
    RAISE EXCEPTION 'Só entregas atribuídas a um entregador podem ser concluídas aqui (status: %)', r.status; END IF;
  IF coalesce(_vasilhames_recebidos,0) < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  v := coalesce(_valor_recebido, r.price);
  IF public._forma_chave(_forma) <> 'promissoria' AND v IS DISTINCT FROM r.price THEN
    IF coalesce(length(trim(_motivo_divergencia)),0) < 5 THEN RAISE EXCEPTION 'Valor diferente do pedido exige motivo'; END IF;
    INSERT INTO public.divergencias(organization_id, order_id, esperado, recebido, motivo, registrado_por)
      VALUES (o, r.id, coalesce(r.price,0), coalesce(v,0), _motivo_divergencia, auth.uid());
  END IF;
  c := public._consumir_carga(o, r.delivery_person_id, r.product, coalesce(r.quantity,1), _vasilhames_recebidos, 0, 'consumo_entrega', r.id);
  IF public._forma_chave(_forma) = 'promissoria' THEN
    PERFORM public._registrar_pagamento(o, r.id, 'entrega', _forma, r.price, r.client_id, r.client_name);
  ELSIF coalesce(v,0) > 0 THEN
    PERFORM public._registrar_pagamento(o, r.id, 'entrega', _forma, v, r.client_id, r.client_name);
  END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='completed', delivered_at=now(), payment_method=_forma, carga_id=c,
    vasilhames_recebidos=coalesce(_vasilhames_recebidos,0), has_empty_cylinder=coalesce(_vasilhames_recebidos,0)>0 WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, r.id);
  RETURN r.id; END $$;

-- ───────────── 8. Venda na portaria (balcão / venda rápida / caixa) ─────────────
-- Pedido + baixa na portaria + pagamento numa transação só. Reenvio com a mesma chave não duplica.
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
  PERFORM public._registrar_pagamento(o, oid, 'venda', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

-- ───────────── 9. Correção administrativa com bloqueios da decisão B ─────────────
CREATE OR REPLACE FUNCTION public.admin_corrigir_pedido(_order_id uuid, _novo_preco numeric, _novo_status text, _motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; d record; aid uuid; tem_pag boolean; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF coalesce(length(trim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório'; END IF;
  IF _novo_status IS NOT NULL AND _novo_status NOT IN ('pending','cancelled') THEN
    RAISE EXCEPTION 'Correção de status permitida só para cancelar ou devolver à fila'; END IF;
  IF _novo_preco IS NOT NULL AND _novo_preco < 0 THEN RAISE EXCEPTION 'Preço inválido'; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  tem_pag := EXISTS (SELECT 1 FROM public.recebimentos WHERE order_id=r.id)
          OR EXISTS (SELECT 1 FROM public.promissory_notes WHERE order_id=r.id)
          OR EXISTS (SELECT 1 FROM public.carga_movimentos WHERE order_id=r.id AND delta_cheios < 0);
  IF r.status IN ('completed','delivered') AND _novo_status IS NOT NULL THEN
    RAISE EXCEPTION 'Venda concluída não pode ser cancelada nem reaberta até a regra de estorno ser decidida (decisão B)' USING ERRCODE='42501'; END IF;
  IF r.status = 'cancelled' THEN RAISE EXCEPTION 'Pedido cancelado não muda' USING ERRCODE='42501'; END IF;
  IF _novo_preco IS NOT NULL AND _novo_preco IS DISTINCT FROM r.price AND (tem_pag OR r.status IN ('completed','delivered')) THEN
    RAISE EXCEPTION 'Preço de venda com pagamento ou baixa registrados não muda até a regra de estorno ser decidida (decisão B)' USING ERRCODE='42501'; END IF;
  IF _novo_status IS NOT NULL AND EXISTS (SELECT 1 FROM public.carga_movimentos WHERE order_id=r.id) THEN
    RAISE EXCEPTION 'Pedido com produto já transferido para carga: registre a devolução da carga antes (sem estorno automático)' USING ERRCODE='42501'; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET price=coalesce(_novo_preco, price), status=coalesce(_novo_status, status),
    delivery_person = CASE WHEN _novo_status IS NOT NULL THEN NULL ELSE delivery_person END,
    delivery_person_id = CASE WHEN _novo_status IS NOT NULL THEN NULL ELSE delivery_person_id END
    WHERE id=_order_id RETURNING * INTO d;
  PERFORM set_config('g1.acao_controlada','off',true);
  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'orders', _order_id, jsonb_build_object('price', r.price, 'status', r.status), jsonb_build_object('price', d.price, 'status', d.status), _motivo, auth.uid())
    RETURNING id INTO aid;
  RETURN aid; END $$;

-- ───────────── 10. Exposição ─────────────
REVOKE ALL ON FUNCTION public._transferir_para_carga(uuid,uuid,text,integer,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.atribuir_entrega(uuid,uuid,boolean,text), public.reatribuir_entrega(uuid,uuid,text),
  public.operador_concluir_entrega(uuid,text,numeric,integer,text,text),
  public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atribuir_entrega(uuid,uuid,boolean,text), public.reatribuir_entrega(uuid,uuid,text),
  public.operador_concluir_entrega(uuid,text,numeric,integer,text,text),
  public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text) TO authenticated;
