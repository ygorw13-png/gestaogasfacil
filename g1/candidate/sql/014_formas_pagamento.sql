-- G1 014 — forma de pagamento com identidade própria (sobre 001–013).
-- * public._forma_pedido: código canônico por modalidade (igual a src/lib/formasPagamento.ts);
--   só grafias equivalentes da mesma modalidade; desconhecida/ambígua -> NULL -> erro claro.
-- * Valor obrigatório (> 0): dinheiro, PIX, crédito, débito, promissória.
--   Valor opcional (NULL = não informado): vale-gás, Gás do Povo, convênio — sem recebimento,
--   sem promissória, sem preço inventado (repasse continua sem regra).
-- * orders.payment_method passa a gravar o código canônico (crédito e débito separados).
-- * _forma_chave fica como está: reversões de vendas antigas continuam lendo o histórico igual.
-- Nenhum registro existente é alterado.

CREATE OR REPLACE FUNCTION public._forma_pedido(_f text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT CASE regexp_replace(translate(lower(btrim(coalesce(_f,''))), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), '[[:space:]_-]+', '', 'g')
    WHEN 'money' THEN 'money' WHEN 'dinheiro' THEN 'money' WHEN 'cash' THEN 'money'
    WHEN 'pix' THEN 'pix'
    WHEN 'credit' THEN 'credit' WHEN 'credito' THEN 'credit' WHEN 'cartaodecredito' THEN 'credit'
    WHEN 'debit' THEN 'debit' WHEN 'debito' THEN 'debit' WHEN 'cartaodedebito' THEN 'debit'
    WHEN 'promissoria' THEN 'promissoria' WHEN 'promissory' THEN 'promissoria' WHEN 'notapromissoria' THEN 'promissoria'
    WHEN 'valegas' THEN 'vale-gas' WHEN 'gasvoucher' THEN 'vale-gas' WHEN 'voucher' THEN 'vale-gas'
    WHEN 'gaspovo' THEN 'gas-povo' WHEN 'gasdopovo' THEN 'gas-povo'
    WHEN 'convenio' THEN 'convenio' WHEN 'partner' THEN 'convenio'
  END $$;

CREATE OR REPLACE FUNCTION public._forma_valor_opcional(_f text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT coalesce(public._forma_pedido(_f) IN ('vale-gas','gas-povo','convenio'), false) $$;

-- Confere forma e valor; devolve o código canônico ou lança erro claro.
CREATE OR REPLACE FUNCTION public._forma_validar(_f text, _valor numeric) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE fp text := public._forma_pedido(_f); BEGIN
  IF fp IS NULL THEN RAISE EXCEPTION 'Forma de pagamento inválida: %', coalesce(nullif(btrim(_f),''),'(vazia)'); END IF;
  IF _valor IS NOT NULL AND _valor < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF public._forma_valor_opcional(fp) THEN
    IF _valor IS NOT NULL AND _valor = 0 THEN RAISE EXCEPTION 'Valor inválido: informe um valor maior que zero ou deixe em branco'; END IF;
  ELSIF _valor IS NULL OR _valor <= 0 THEN
    RAISE EXCEPTION 'Informe um valor maior que zero para esta forma de pagamento (%)', fp;
  END IF;
  RETURN fp; END $$;

-- Pagamento: modalidades opcionais não geram recebimento nem promissória.
CREATE OR REPLACE FUNCTION public._registrar_pagamento(_org uuid, _order uuid, _origem text, _forma text, _valor numeric, _cliente uuid, _cliente_nome text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE fp text := public._forma_pedido(_forma); f text; dest text; resp uuid; antes text := coalesce(current_setting('g1.acao_controlada',true),''); BEGIN
  IF fp IS NULL THEN RAISE EXCEPTION 'Forma de pagamento inválida: %', coalesce(nullif(btrim(_forma),''),'(vazia)'); END IF;
  IF public._forma_valor_opcional(fp) THEN
    IF _valor IS NOT NULL AND _valor < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
    RETURN;
  END IF;
  f := public._forma_chave(fp);
  PERFORM set_config('g1.acao_controlada','on',true);
  IF f IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF f = 'promissoria' THEN
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Venda a prazo exige valor'; END IF;
    INSERT INTO public.promissory_notes(organization_id, client_id, client_name, value, due_date, status, created_by, order_id, notes)
      VALUES (_org, _cliente, coalesce(_cliente_nome,'Cliente'), _valor, public.data_operacional() + 30, 'pending', auth.uid(), _order, 'Venda a prazo');
  ELSE
    IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe o valor recebido'; END IF;
    IF f <> 'dinheiro' THEN dest := 'nao_informado';
    ELSIF _origem IN ('entrega','venda_rua') THEN
      dest := 'entregador';
      SELECT delivery_person_id INTO resp FROM public.orders WHERE id=_order;
      IF resp IS NULL THEN RAISE EXCEPTION 'Entrega sem entregador identificado: o dinheiro não tem responsável'; END IF;
    ELSE dest := 'caixa'; END IF;
    INSERT INTO public.recebimentos(organization_id, origem, order_id, valor, forma, recebido_por, destino, responsavel_id)
      VALUES (_org, _origem, _order, _valor, f, auth.uid(), dest, resp);
  END IF;
  PERFORM set_config('g1.acao_controlada',antes,true);
END $$;
REVOKE ALL ON FUNCTION public._registrar_pagamento(uuid,uuid,text,text,numeric,uuid,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.venda_portaria(_cliente_id uuid, _cliente_nome text, _produto text, _quantidade integer, _valor numeric, _forma text, _tipo_venda text, _devolveu_vazio boolean, _reseller_id uuid, _observacoes text, _chave text, _vasilhames_recebidos integer DEFAULT NULL::integer, _comodato boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); oid uuid; prev uuid; k text := public._produto_chave(_produto);
  t text := public._tipo_venda_chave(coalesce(_tipo_venda,'recarga'));
  dev boolean; com boolean := coalesce(_comodato,false); vaz integer; emp integer; h text; fp text; antes text := coalesce(current_setting('g1.acao_controlada',true),''); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Venda exige chave de reenvio'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de estoque: %', _produto; END IF;
  IF t IS NULL THEN RAISE EXCEPTION 'Tipo de venda inválido: %', _tipo_venda; END IF;
  fp := public._forma_validar(_forma, _valor);
  IF _vasilhames_recebidos IS NOT NULL AND _vasilhames_recebidos < 0 THEN RAISE EXCEPTION 'Vasilhames recebidos inválidos'; END IF;
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  IF _reseller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.resellers WHERE id=_reseller_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Revenda de outra empresa'; END IF;
  dev := coalesce(_devolveu_vazio, t='recarga');
  vaz := CASE WHEN t='vasilhame' THEN 0 WHEN com THEN 0 ELSE coalesce(_vasilhames_recebidos, CASE WHEN t='recarga' THEN _quantidade ELSE 0 END) END;
  emp := CASE WHEN com AND t<>'vasilhame' THEN _quantidade ELSE 0 END;
  -- hash: mesma fórmula do 010 para as formas antigas; as opcionais entram pelo próprio código.
  h := md5(concat_ws('|', coalesce(_cliente_id::text,''), coalesce(btrim(_cliente_nome),''), k, _quantidade::text,
        round(coalesce(_valor,0),2)::text, coalesce(CASE WHEN public._forma_valor_opcional(fp) THEN fp END, public._forma_chave(fp)), t, dev::text, coalesce(_reseller_id::text,''),
        coalesce(btrim(_observacoes),''), vaz::text, emp::text));
  prev := public._reenvio(o, _chave, 'venda_portaria', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, reseller_id, client_name, address, product, quantity, price, payment_method,
    status, delivered_at, origem_venda, tipo_venda, has_empty_cylinder, vasilhames_entregues, vasilhames_recebidos, notes)
  VALUES (auth.uid(), o, _cliente_id, _reseller_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente Balcão'), '{}'::jsonb, _produto, _quantidade, _valor, fp,
    'delivered', now(), 'portaria', t, dev,
    CASE WHEN t IN ('vasilhame','completa') THEN _quantidade ELSE 0 END, vaz, _observacoes)
  RETURNING id INTO oid;
  PERFORM public.registrar_movimentacao_portaria(CASE WHEN com THEN 'venda_comodato' ELSE 'venda' END, k,
    CASE WHEN t='vasilhame' THEN 0 ELSE -_quantidade END,
    CASE WHEN t='vasilhame' THEN -_quantidade ELSE vaz END,
    emp, _cliente_id, _cliente_nome, oid, 'Venda na portaria');
  PERFORM public._registrar_pagamento(o, oid, 'venda', fp, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  PERFORM set_config('g1.acao_controlada',antes,true);
  RETURN oid; END $$;

CREATE OR REPLACE FUNCTION public.entregador_venda_rua(_cliente_id uuid, _cliente_nome text, _cliente_fone text, _produto text, _quantidade integer, _valor numeric, _forma text, _tipo_venda text, _vasilhames_entregues integer, _vasilhames_recebidos integer, _observacoes text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); c uuid; oid uuid; prev uuid; t text := public._tipo_venda_chave(_tipo_venda); h text; fp text; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Venda na rua exige chave de reenvio'; END IF;
  IF t IS NULL THEN RAISE EXCEPTION 'Tipo de venda inválido: %', _tipo_venda; END IF;
  IF coalesce(_vasilhames_entregues,0) < 0 OR coalesce(_vasilhames_recebidos,0) < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  fp := public._forma_validar(_forma, _valor);
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  h := md5(concat_ws('|', coalesce(_cliente_id::text,''), coalesce(btrim(_cliente_nome),''), coalesce(btrim(_cliente_fone),''),
        coalesce(public._produto_chave(_produto), _produto), _quantidade::text, round(coalesce(_valor,0),2)::text,
        coalesce(CASE WHEN public._forma_valor_opcional(fp) THEN fp END, public._forma_chave(fp)), t, coalesce(_vasilhames_entregues,0)::text, coalesce(_vasilhames_recebidos,0)::text, coalesce(btrim(_observacoes),'')));
  prev := public._reenvio(o, _chave, 'venda_rua', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, client_name, client_phone, product, quantity, price, payment_method,
    notes, status, delivery_person, delivery_person_id, delivered_at, origem_venda, tipo_venda, vasilhames_entregues, vasilhames_recebidos, has_empty_cylinder)
  VALUES (auth.uid(), o, _cliente_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente avulso'), _cliente_fone, _produto, _quantidade, _valor, fp,
    _observacoes, 'completed', auth.uid()::text, auth.uid(), now(), 'rua', t,
    CASE WHEN t='recarga' THEN 0 ELSE coalesce(_vasilhames_entregues,0) END,
    CASE WHEN t='vasilhame' THEN 0 ELSE coalesce(_vasilhames_recebidos,0) END,
    t<>'vasilhame' AND coalesce(_vasilhames_recebidos,0)>0)
  RETURNING id INTO oid;
  IF t = 'vasilhame' THEN
    c := public._consumir_vazios_carga(o, auth.uid(), _produto, _quantidade, oid);
  ELSE
    c := public._consumir_carga(o, auth.uid(), _produto, _quantidade, _vasilhames_recebidos, coalesce(_vasilhames_entregues,0), 'consumo_venda_rua', oid);
  END IF;
  UPDATE public.orders SET carga_id=c WHERE id=oid;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._registrar_pagamento(o, oid, 'venda_rua', fp, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

CREATE OR REPLACE FUNCTION public.entregador_concluir_entrega(_order_id uuid, _forma text, _vasilhames_recebidos integer, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); r record; c uuid; prev uuid; fp text := public._forma_pedido(_forma); BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF fp IS NULL THEN RAISE EXCEPTION 'Forma de pagamento inválida: %', coalesce(nullif(btrim(_forma),''),'(vazia)'); END IF;
  prev := public._reenvio(o, _chave, 'concluir_entrega'); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL OR r.delivery_person_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Entrega não atribuída a você' USING ERRCODE='42501'; END IF;
  IF r.status <> 'delivering' THEN RAISE EXCEPTION 'Transição inválida: % -> completed', r.status; END IF;
  IF coalesce(_vasilhames_recebidos,0) < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  c := public._consumir_carga(o, auth.uid(), r.product, coalesce(r.quantity,1), _vasilhames_recebidos, 0, 'consumo_entrega', r.id);
  PERFORM public._registrar_pagamento(o, r.id, 'entrega', fp, r.price, r.client_id, r.client_name);
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='completed', delivered_at=now(), payment_method=fp, carga_id=c,
    vasilhames_recebidos=coalesce(_vasilhames_recebidos,0), has_empty_cylinder=coalesce(_vasilhames_recebidos,0)>0 WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, r.id);
  RETURN r.id; END $$;

CREATE OR REPLACE FUNCTION public.operador_concluir_entrega(_order_id uuid, _forma text, _valor_recebido numeric,
  _vasilhames_recebidos integer, _motivo_divergencia text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid := public._ctx_org(); r record; c uuid; prev uuid; v numeric; f text; h text; fp text; opc boolean; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Conclusão exige chave de reenvio'; END IF;
  IF nullif(trim(coalesce(_forma,'')),'') IS NULL THEN RAISE EXCEPTION 'Informe a forma de pagamento efetiva'; END IF;
  fp := public._forma_pedido(_forma);
  IF fp IS NULL THEN RAISE EXCEPTION 'Forma de pagamento inválida: %', _forma; END IF;
  opc := public._forma_valor_opcional(fp);
  IF _vasilhames_recebidos IS NULL THEN RAISE EXCEPTION 'Informe quantos cascos vazios foram recebidos (0 se nenhum)'; END IF;
  IF _vasilhames_recebidos < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  f := public._forma_chave(fp);
  IF NOT opc AND coalesce(f,'') <> 'promissoria' AND _valor_recebido IS NULL THEN RAISE EXCEPTION 'Informe o valor realmente recebido'; END IF;
  IF _valor_recebido < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  h := md5(concat_ws('|', _order_id::text, _forma, coalesce(_valor_recebido::text,'-'), _vasilhames_recebidos::text, coalesce(trim(_motivo_divergencia),'')));
  prev := public._reenvio(o, _chave, 'operador_concluir', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF r.status NOT IN ('assigned','delivering') OR r.delivery_person_id IS NULL THEN
    RAISE EXCEPTION 'Só entregas atribuídas a um entregador identificado podem ser concluídas (status: %)', r.status; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
                 WHERE p.id=r.delivery_person_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'O entregador atribuído está inativo ou sem acesso: reatribua antes de concluir'; END IF;
  v := CASE WHEN f = 'promissoria' AND NOT opc THEN r.price ELSE _valor_recebido END;
  IF NOT opc AND coalesce(f,'') <> 'promissoria' AND v IS DISTINCT FROM r.price THEN
    IF coalesce(length(trim(_motivo_divergencia)),0) < 5 THEN RAISE EXCEPTION 'Valor diferente do pedido exige motivo'; END IF;
    INSERT INTO public.divergencias(organization_id, order_id, esperado, recebido, motivo, registrado_por)
      VALUES (o, r.id, coalesce(r.price,0), coalesce(v,0), _motivo_divergencia, auth.uid());
  END IF;
  c := public._consumir_carga(o, r.delivery_person_id, r.product, coalesce(r.quantity,1), _vasilhames_recebidos, 0, 'consumo_entrega', r.id);
  IF opc THEN
    NULL; -- vale-gás, Gás do Povo, convênio: sem recebimento nem promissória
  ELSIF f = 'promissoria' THEN
    PERFORM public._registrar_pagamento(o, r.id, 'entrega', fp, r.price, r.client_id, r.client_name);
  ELSIF coalesce(v,0) > 0 THEN
    PERFORM public._registrar_pagamento(o, r.id, 'entrega', fp, v, r.client_id, r.client_name);
  END IF;
  PERFORM set_config('g1.entrega_motivo', 'Concluída pela portaria', true);
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='completed', delivered_at=now(), payment_method=fp, carga_id=c,
    vasilhames_recebidos=_vasilhames_recebidos, has_empty_cylinder=_vasilhames_recebidos>0 WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM set_config('g1.entrega_motivo', '', true);
  PERFORM public._reenvio_fim(o, _chave, r.id);
  RETURN r.id; END $$;

REVOKE ALL ON FUNCTION public._forma_validar(text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._forma_pedido(text), public._forma_valor_opcional(text) TO authenticated, service_role;
