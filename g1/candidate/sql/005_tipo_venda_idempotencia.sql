-- G1 — 005 CANDIDATO: tipo de venda canônico + reenvio preso ao conteúdo.
-- NÃO aplicar em produção sem aprovação explícita. Pressupõe G0.1 001 + G1 002 + 003 + 004.
-- Executar com psql -1 (transação única). Idempotente. Não reescreve nenhum dado existente.
--
-- (O 005 previsto no HANDOFF como "005_saldo_portaria" passou a ser o 006: a numeração segue a ordem de aplicação.)
--
-- 1. Valor canônico de orders.tipo_venda = 'completa' (padrão da coluna, das telas e dos relatórios).
--    'completo' é aceito como entrada alternativa e gravado como 'completa'. Valores já gravados não mudam;
--    as telas leem 'completo' como 'completa' (src/lib/saleTypes.ts: normalizarTipoVenda).
-- 2. A chave de reenvio passa a guardar um resumo do CONTEÚDO da operação. Mesma chave com outro conteúdo é
--    recusada (antes devolvia, em silêncio, o resultado da primeira operação).
-- 3. venda_portaria recebe os cascos recebidos e o comodato informados pela tela (antes eram deduzidos do tipo
--    e a ação ignorava devolução de cascos além da quantidade e o comodato, divergindo do caminho antigo).

-- ───────────── 1. Tipo de venda ─────────────
CREATE OR REPLACE FUNCTION public._tipo_venda_chave(_t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(btrim(coalesce(_t,'')))
    WHEN 'completa' THEN 'completa' WHEN 'completo' THEN 'completa'
    WHEN 'recarga' THEN 'recarga' WHEN 'vasilhame' THEN 'vasilhame' END $$;

-- ───────────── 2. Reenvio preso ao conteúdo ─────────────
ALTER TABLE public.acoes_idempotentes ADD COLUMN IF NOT EXISTS conteudo text;

CREATE OR REPLACE FUNCTION public._reenvio(_org uuid, _chave text, _acao text, _hash text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; BEGIN
  IF _chave IS NULL OR length(_chave) < 8 THEN RAISE EXCEPTION 'Chave de envio obrigatória'; END IF;
  INSERT INTO public.acoes_idempotentes(organization_id, chave, acao, usuario, conteudo) VALUES (_org, _chave, _acao, auth.uid(), _hash)
    ON CONFLICT DO NOTHING;
  IF FOUND THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.acoes_idempotentes WHERE organization_id=_org AND chave=_chave;
  IF r.acao <> _acao OR r.usuario <> auth.uid() THEN RAISE EXCEPTION 'Chave já usada em outra ação'; END IF;
  IF r.conteudo IS NOT NULL AND r.conteudo IS DISTINCT FROM _hash THEN
    RAISE EXCEPTION 'Chave já usada com outro conteúdo. Se a venda anterior não aparece na lista, registre como nova venda'; END IF;
  RETURN r.resultado; END $$;
REVOKE ALL ON FUNCTION public._reenvio(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

-- ───────────── 3. Venda na portaria ─────────────
DROP FUNCTION IF EXISTS public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text);
CREATE OR REPLACE FUNCTION public.venda_portaria(_cliente_id uuid, _cliente_nome text, _produto text, _quantidade integer,
  _valor numeric, _forma text, _tipo_venda text, _devolveu_vazio boolean, _reseller_id uuid, _observacoes text, _chave text,
  _vasilhames_recebidos integer DEFAULT NULL, _comodato boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); oid uuid; prev uuid; k text := public._produto_chave(_produto);
  t text := public._tipo_venda_chave(coalesce(_tipo_venda,'recarga'));
  dev boolean; com boolean := coalesce(_comodato,false); vaz integer; emp integer; h text; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Venda exige chave de reenvio'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de estoque: %', _produto; END IF;
  IF t IS NULL THEN RAISE EXCEPTION 'Tipo de venda inválido: %', _tipo_venda; END IF;
  IF public._forma_chave(_forma) IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF _vasilhames_recebidos IS NOT NULL AND _vasilhames_recebidos < 0 THEN RAISE EXCEPTION 'Vasilhames recebidos inválidos'; END IF;
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  IF _reseller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.resellers WHERE id=_reseller_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Revenda de outra empresa'; END IF;
  dev := coalesce(_devolveu_vazio, t='recarga');
  -- cascos vazios que entram: informado pela tela; senão, o do tipo (recarga = um por unidade). Comodato: nenhum entra.
  vaz := CASE WHEN t='vasilhame' THEN 0 WHEN com THEN 0 ELSE coalesce(_vasilhames_recebidos, CASE WHEN t='recarga' THEN _quantidade ELSE 0 END) END;
  emp := CASE WHEN com AND t<>'vasilhame' THEN _quantidade ELSE 0 END;
  h := md5(concat_ws('|', coalesce(_cliente_id::text,''), coalesce(btrim(_cliente_nome),''), k, _quantidade::text,
        round(coalesce(_valor,0),2)::text, public._forma_chave(_forma), t, dev::text, coalesce(_reseller_id::text,''),
        coalesce(btrim(_observacoes),''), vaz::text, emp::text));
  prev := public._reenvio(o, _chave, 'venda_portaria', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  INSERT INTO public.orders(user_id, organization_id, client_id, reseller_id, client_name, address, product, quantity, price, payment_method,
    status, delivered_at, origem_venda, tipo_venda, has_empty_cylinder, vasilhames_entregues, vasilhames_recebidos, notes)
  VALUES (auth.uid(), o, _cliente_id, _reseller_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente Balcão'), '{}'::jsonb, _produto, _quantidade, coalesce(_valor,0), _forma,
    'delivered', now(), 'portaria', t, dev,
    CASE WHEN t IN ('vasilhame','completa') THEN _quantidade ELSE 0 END, vaz, _observacoes)
  RETURNING id INTO oid;
  PERFORM public.registrar_movimentacao_portaria(CASE WHEN com THEN 'venda_comodato' ELSE 'venda' END, k,
    CASE WHEN t='vasilhame' THEN 0 ELSE -_quantidade END,
    CASE WHEN t='vasilhame' THEN -_quantidade ELSE vaz END,
    emp, _cliente_id, _cliente_nome, oid, 'Venda na portaria');
  PERFORM public._registrar_pagamento(o, oid, 'venda', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

-- ───────────── 4. Venda na rua (mesma assinatura: a contenção 004 depende dela) ─────────────
CREATE OR REPLACE FUNCTION public.entregador_venda_rua(_cliente_id uuid, _cliente_nome text, _cliente_fone text, _produto text,
  _quantidade integer, _valor numeric, _forma text, _tipo_venda text, _vasilhames_entregues integer, _vasilhames_recebidos integer,
  _observacoes text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); c uuid; oid uuid; prev uuid; t text := public._tipo_venda_chave(_tipo_venda); h text; BEGIN
  IF NOT public.is_entregador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Venda na rua exige chave de reenvio'; END IF;
  IF t IS NULL THEN RAISE EXCEPTION 'Tipo de venda inválido: %', _tipo_venda; END IF;
  IF coalesce(_vasilhames_entregues,0) < 0 OR coalesce(_vasilhames_recebidos,0) < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  IF public._forma_chave(_forma) IS NULL THEN RAISE EXCEPTION 'Forma de pagamento sem regra de recebimento: %', _forma; END IF;
  IF _cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=_cliente_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Cliente de outra empresa'; END IF;
  h := md5(concat_ws('|', coalesce(_cliente_id::text,''), coalesce(btrim(_cliente_nome),''), coalesce(btrim(_cliente_fone),''),
        coalesce(public._produto_chave(_produto), _produto), _quantidade::text, round(coalesce(_valor,0),2)::text,
        public._forma_chave(_forma), t, coalesce(_vasilhames_entregues,0)::text, coalesce(_vasilhames_recebidos,0)::text, coalesce(btrim(_observacoes),'')));
  prev := public._reenvio(o, _chave, 'venda_rua', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, client_name, client_phone, product, quantity, price, payment_method,
    notes, status, delivery_person, delivery_person_id, delivered_at, origem_venda, tipo_venda, vasilhames_entregues, vasilhames_recebidos, has_empty_cylinder)
  VALUES (auth.uid(), o, _cliente_id, coalesce(nullif(trim(_cliente_nome),''),'Cliente avulso'), _cliente_fone, _produto, _quantidade, coalesce(_valor,0), _forma,
    _observacoes, 'completed', auth.uid()::text, auth.uid(), now(), 'rua', t, coalesce(_vasilhames_entregues,0), coalesce(_vasilhames_recebidos,0), coalesce(_vasilhames_recebidos,0)>0)
  RETURNING id INTO oid;
  c := public._consumir_carga(o, auth.uid(), _produto, _quantidade, _vasilhames_recebidos, coalesce(_vasilhames_entregues,0), 'consumo_venda_rua', oid);
  UPDATE public.orders SET carga_id=c WHERE id=oid;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._registrar_pagamento(o, oid, 'venda_rua', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;

-- ───────────── 5. Exposição ─────────────
REVOKE ALL ON FUNCTION public._tipo_venda_chave(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text,integer,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.venda_portaria(uuid,text,text,integer,numeric,text,text,boolean,uuid,text,text,integer,boolean) TO authenticated;
-- entregador_venda_rua mantém os grants atuais (CREATE OR REPLACE não os altera).
