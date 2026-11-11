-- G1 — 007 CANDIDATO: telas da carga (saldo, histórico, devolução).
-- NÃO aplicar em produção sem aprovação explícita. Pressupõe 001 + 002 + 003 + 004 + 005 + 006.
-- Executar com psql -1 (transação única). Idempotente. Não altera registros existentes.
--
-- 1. carga_devolver (mesma assinatura; a contenção 004 não a usa):
--    produto normalizado (antes, 'Botijão P13' falhava no CHECK da portaria e a conferência de vazios
--    comparava texto cru); chave presa ao conteúdo; devolução de cheios e vazios limitada ao que está
--    na carga (o entregador não transforma a devolução em entrada livre de estoque); grava na data operacional.
-- 2. Consultas somente leitura para as telas: carga_resumo (saldo por produto) e carga_historico.
--    Operador/admin: qualquer entregador da empresa. Entregador: só a própria carga (outro ID = recusa).

CREATE OR REPLACE FUNCTION public.carga_devolver(_carga_id uuid, _produto text, _cheios integer, _vazios integer, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); k record; prev uuid; mid uuid; p text := public._produto_chave(_produto);
  ch integer := coalesce(_cheios,0); vz integer := coalesce(_vazios,0); h text; BEGIN
  IF p IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', _produto; END IF;
  IF ch < 0 OR vz < 0 OR ch + vz = 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Devolução exige chave de reenvio'; END IF;
  SELECT * INTO k FROM public.cargas WHERE id=_carga_id AND organization_id=o FOR UPDATE;
  IF k.id IS NULL OR k.status <> 'aberta' THEN RAISE EXCEPTION 'Carga inexistente ou encerrada'; END IF;
  IF NOT (public.is_operador() OR (public.is_entregador() AND k.entregador_id = auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  h := md5(concat_ws('|', _carga_id::text, p, ch::text, vz::text));
  prev := public._reenvio(o, _chave, 'carga_devolver', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  IF public._saldo_carga(_carga_id, p) < ch THEN
    RAISE EXCEPTION 'Devolução maior que a carga: há % cheio(s) de % na carga', greatest(public._saldo_carga(_carga_id, p),0), p; END IF;
  IF (SELECT coalesce(sum(delta_vazios),0) FROM public.carga_movimentos WHERE carga_id=_carga_id AND produto=p) < vz THEN
    RAISE EXCEPTION 'Vazios maiores que os recolhidos na carga'; END IF;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, registrado_por)
    VALUES (o, _carga_id, 'devolucao', p, -ch, -vz, auth.uid()) RETURNING id INTO mid;
  PERFORM set_config('g1.acao_controlada','on',true);
  PERFORM public.registrar_movimentacao_portaria('retorno_carga', p, ch, vz, 0, NULL, NULL, _carga_id,
    CASE WHEN public.is_operador() THEN 'Retorno de carga' ELSE 'Retorno de carga (registrado pelo entregador)' END);
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, mid);
  RETURN mid; END $$;

-- Quem pode consultar a carga de qual entregador.
CREATE OR REPLACE FUNCTION public._carga_alvo(_entregador_id uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF public.is_operador() THEN
    IF _entregador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_entregador_id AND organization_id=o) THEN
      RAISE EXCEPTION 'Entregador de outra empresa' USING ERRCODE='42501'; END IF;
    RETURN _entregador_id;               -- NULL = todos da empresa
  ELSIF public.is_entregador() THEN
    IF _entregador_id IS NOT NULL AND _entregador_id <> auth.uid() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
    RETURN auth.uid();
  END IF;
  RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501';
END $$;

-- Saldo da carga ABERTA por entregador e produto (cheios a vender/devolver, vazios recolhidos a devolver).
CREATE OR REPLACE FUNCTION public.carga_resumo(_entregador_id uuid DEFAULT NULL)
RETURNS TABLE(carga_id uuid, entregador_id uuid, entregador_nome text, aberta_em timestamptz, produto text, cheios integer, vazios integer, cascos_entregues integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); alvo uuid := public._carga_alvo(_entregador_id); BEGIN
  RETURN QUERY
    SELECT c.id, c.entregador_id, coalesce(pr.name, 'Entregador'), c.criado_em, m.produto,
           coalesce(sum(m.delta_cheios),0)::int, coalesce(sum(m.delta_vazios),0)::int, coalesce(sum(m.delta_emprestados),0)::int
      FROM public.cargas c
      JOIN public.carga_movimentos m ON m.carga_id = c.id
      LEFT JOIN public.profiles pr ON pr.id = c.entregador_id
     WHERE c.organization_id = o AND c.status = 'aberta' AND (alvo IS NULL OR c.entregador_id = alvo)
     GROUP BY c.id, c.entregador_id, pr.name, c.criado_em, m.produto
     ORDER BY 3, 5;
END $$;

-- Histórico de movimentos das cargas (abertas e encerradas) do período, mais recentes primeiro.
CREATE OR REPLACE FUNCTION public.carga_historico(_entregador_id uuid DEFAULT NULL, _dias integer DEFAULT 7)
RETURNS TABLE(id uuid, carga_id uuid, entregador_id uuid, entregador_nome text, tipo text, produto text,
  delta_cheios integer, delta_vazios integer, order_id uuid, cliente text, registrado_por_nome text, criado_em timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); alvo uuid := public._carga_alvo(_entregador_id); BEGIN
  IF _dias IS NULL OR _dias < 1 OR _dias > 62 THEN RAISE EXCEPTION 'Período inválido (1 a 62 dias)'; END IF;
  RETURN QUERY
    SELECT m.id, m.carga_id, c.entregador_id, coalesce(pe.name,'Entregador'), m.tipo, m.produto, m.delta_cheios, m.delta_vazios,
           m.order_id, ord.client_name, coalesce(pr.name,'—'), m.criado_em
      FROM public.carga_movimentos m
      JOIN public.cargas c ON c.id = m.carga_id
      LEFT JOIN public.profiles pe ON pe.id = c.entregador_id
      LEFT JOIN public.profiles pr ON pr.id = m.registrado_por
      LEFT JOIN public.orders ord ON ord.id = m.order_id
     WHERE m.organization_id = o AND (alvo IS NULL OR c.entregador_id = alvo)
       AND m.criado_em >= (public.data_operacional() - (_dias - 1))::timestamp AT TIME ZONE 'America/Bahia'
     ORDER BY m.criado_em DESC
     LIMIT 500;
END $$;

REVOKE ALL ON FUNCTION public._carga_alvo(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.carga_resumo(uuid), public.carga_historico(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carga_resumo(uuid), public.carga_historico(uuid,integer) TO authenticated;

-- ───────────── 3. Venda na rua de vasilhame consome VAZIO da carga ─────────────
-- Antes, a venda só do casco baixava um CHEIO da carga. Agora segue a regra da portaria (venda de vasilhame
-- tira um vazio): exige vazios recolhidos na carga e não toca nos cheios. Mesma assinatura (contenção 004).
CREATE OR REPLACE FUNCTION public._consumir_vazios_carga(_org uuid, _entregador uuid, _produto text, _qtd integer, _order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; k text := public._produto_chave(_produto); v integer; BEGIN
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', _produto; END IF;
  SELECT id INTO c FROM public.cargas WHERE organization_id=_org AND entregador_id=_entregador AND status='aberta' FOR UPDATE;
  IF c IS NULL THEN RAISE EXCEPTION 'Entregador sem carga aberta'; END IF;
  SELECT coalesce(sum(delta_vazios),0) INTO v FROM public.carga_movimentos WHERE carga_id=c AND produto=k;
  IF v < _qtd THEN RAISE EXCEPTION 'Vazios insuficientes na carga para vender vasilhame de %: há %', k, greatest(v,0); END IF;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, order_id, registrado_por)
    VALUES (_org, c, 'consumo_venda_rua', k, 0, -_qtd, _order, auth.uid());
  RETURN c; END $$;
REVOKE ALL ON FUNCTION public._consumir_vazios_carga(uuid,uuid,text,integer,uuid) FROM PUBLIC, anon, authenticated;

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
  PERFORM public._registrar_pagamento(o, oid, 'venda_rua', _forma, _valor, _cliente_id, _cliente_nome);
  PERFORM public._reenvio_fim(o, _chave, oid);
  RETURN oid; END $$;