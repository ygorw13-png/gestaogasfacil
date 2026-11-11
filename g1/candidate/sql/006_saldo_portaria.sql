-- G1 — 006 CANDIDATO: saldo da portaria na transferência para a carga + data operacional America/Bahia.
-- NÃO aplicar em produção sem aprovação explícita. Pressupõe G0.1 001 + G1 002 + 003 + 004 + 005.
-- Executar com psql -1 (transação única). Idempotente. Não altera nenhum registro existente.
--
-- 1. Data operacional = data civil em America/Bahia, calculada no servidor (data_operacional()).
--    Antes: CURRENT_DATE na sessão do banco (UTC no Cloud) e, nas telas, new Date().toISOString() (UTC).
--    Entre 21:00 e 23:59 (Bahia) as movimentações caíam no dia seguinte. Passa a valer como padrão da
--    coluna e de registrar_movimentacao_portaria. Os dias já gravados NÃO são reescritos.
--    ATIVAÇÃO COORDENADA: o frontend com VITE_G1_ACOES=on passa a consultar o mesmo dia (src/lib/dataOperacional.ts).
--    Aplicar fora da janela 21:00–23:59 (Bahia), quando as duas datas coincidem.
-- 2. Transferência portaria -> carga (carga_saida e atribuição com retirada) passa a:
--    validar empresa, entregador (ativo, papel entregador, mesma empresa), produto e quantidade;
--    EXIGIR a abertura do dia registrada (tipo 'abertura' na data operacional) — sem criar abertura nem saldo;
--    recusar quantidade acima dos cheios disponíveis na portaria naquele dia;
--    validar e movimentar na mesma transação, sob trava por (empresa, produto, dia) compartilhada com todo
--    movimento da portaria (vendas, ajustes, retornos), para não disputar o mesmo saldo.
--    A idempotência continua nas ações que chamam a transferência (chave obrigatória).
-- 3. Vendas de balcão NÃO passam a ser bloqueadas por saldo (a tela permite vender antes da abertura; mudar
--    isso é decisão do proprietário). Elas só entram na mesma trava, para a transferência ver um saldo correto.

-- ───────────── 1. Data operacional ─────────────
CREATE OR REPLACE FUNCTION public.data_operacional() RETURNS date LANGUAGE sql STABLE
AS $$ SELECT (now() AT TIME ZONE 'America/Bahia')::date $$;
REVOKE ALL ON FUNCTION public.data_operacional() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.data_operacional() TO authenticated, service_role;

ALTER TABLE public.movimentacoes_portaria ALTER COLUMN data_operacao SET DEFAULT public.data_operacional();

-- ───────────── 2. Trava e saldo ─────────────
-- Trava de transação por (empresa, produto, dia). Ordem de travas em toda ação: pedido -> carga -> portaria.
CREATE OR REPLACE FUNCTION public._travar_portaria(_org uuid, _produto text, _data date) RETURNS void
LANGUAGE sql AS $$ SELECT pg_advisory_xact_lock(hashtextextended('g1.portaria|' || _org || '|' || _produto || '|' || _data, 0)) $$;

-- Cheios na portaria no dia (mesma regra da view saldo_portaria_atual: pátio fica fora).
CREATE OR REPLACE FUNCTION public._saldo_portaria_cheios(_org uuid, _produto text, _data date) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(sum(delta_cheios),0)::int FROM public.movimentacoes_portaria
   WHERE organization_id=_org AND produto=_produto AND data_operacao=_data AND tipo NOT IN ('entrada_patio','ajuste_patio') $$;

-- ───────────── 3. Movimento da portaria: data operacional + trava ─────────────
-- Mesma assinatura e mesmas regras do 003; muda o padrão da data (era CURRENT_DATE) e entra na trava.
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_portaria(_tipo text, _produto text, _delta_cheios integer, _delta_vazios integer,
  _delta_emprestados integer, _cliente_id uuid DEFAULT NULL::uuid, _cliente_nome text DEFAULT NULL::text, _referencia_id uuid DEFAULT NULL::uuid,
  _observacoes text DEFAULT NULL::text, _data_operacao date DEFAULT public.data_operacional())
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _id uuid; _user_name text; _org uuid := public.get_my_org(); _ctl boolean := coalesce(current_setting('g1.acao_controlada', true), '') = 'on';
  _d date := coalesce(_data_operacao, public.data_operacional());
BEGIN
  IF _org IS NULL THEN RAISE EXCEPTION 'Conta inativa ou sem empresa' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão para movimentar estoque' USING ERRCODE = '42501'; END IF;
  IF NOT _ctl AND _tipo IN ('saida_carga','retorno_carga') THEN RAISE EXCEPTION 'Use a ação de carga' USING ERRCODE = '42501'; END IF;
  IF _tipo NOT IN ('entrada_patio','ajuste_patio') THEN PERFORM public._travar_portaria(_org, _produto, _d); END IF;
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(organization_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes, registrado_por, registrado_por_nome, data_operacao)
  VALUES (_org, _tipo, _produto, _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes, auth.uid(), _user_name, _d) RETURNING id INTO _id;
  RETURN _id;
END $function$;
REVOKE ALL ON FUNCTION public.registrar_movimentacao_portaria(text,text,integer,integer,integer,uuid,text,uuid,text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_portaria(text,text,integer,integer,integer,uuid,text,uuid,text,date) TO authenticated;

-- ───────────── 4. Transferência portaria -> carga ─────────────
CREATE OR REPLACE FUNCTION public._transferir_para_carga(_org uuid, _entregador uuid, _produto text, _cheios integer, _ref_order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid; k text := public._produto_chave(_produto); d date := public.data_operacional(); s integer; BEGIN
  IF _org IS NULL OR _org IS DISTINCT FROM public.get_my_org() THEN RAISE EXCEPTION 'Empresa inválida' USING ERRCODE='42501'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', _produto; END IF;
  IF _cheios IS NULL OR _cheios <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
                 WHERE p.id=_entregador AND p.organization_id=_org AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  -- trava 1: a carga do entregador (mesma ordem usada na devolução e no consumo)
  INSERT INTO public.cargas(organization_id, entregador_id, criado_por) VALUES (_org, _entregador, auth.uid())
    ON CONFLICT (organization_id, entregador_id) WHERE status='aberta' DO NOTHING;
  SELECT id INTO c FROM public.cargas WHERE organization_id=_org AND entregador_id=_entregador AND status='aberta' FOR UPDATE;
  -- trava 2: o saldo da portaria deste produto neste dia
  PERFORM public._travar_portaria(_org, k, d);
  IF NOT EXISTS (SELECT 1 FROM public.movimentacoes_portaria WHERE organization_id=_org AND data_operacao=d AND tipo='abertura') THEN
    RAISE EXCEPTION 'A abertura da portaria de % ainda não foi registrada. Confirme a abertura do dia antes de transferir para a carga', to_char(d,'DD/MM/YYYY');
  END IF;
  s := public._saldo_portaria_cheios(_org, k, d);
  IF s < _cheios THEN
    RAISE EXCEPTION 'Saldo insuficiente na portaria para %: disponível %, solicitado %', k, greatest(s,0), _cheios;
  END IF;
  INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, order_id, registrado_por)
    VALUES (_org, c, 'saida_portaria', k, _cheios, _ref_order, auth.uid());
  PERFORM set_config('g1.acao_controlada','on',true);
  PERFORM public.registrar_movimentacao_portaria('saida_carga', k, -_cheios, 0, 0, NULL, NULL, c,
    CASE WHEN _ref_order IS NULL THEN 'Transferência para carga' ELSE 'Transferência para carga (entrega avulsa)' END, d);
  RETURN c; END $$;
REVOKE ALL ON FUNCTION public._transferir_para_carga(uuid,uuid,text,integer,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._travar_portaria(uuid,text,date), public._saldo_portaria_cheios(uuid,text,date) FROM PUBLIC, anon, authenticated;

-- ───────────── 5. Consulta para a tela (somente leitura) ─────────────
-- Saldo transferível agora, com o motivo quando não há (sem abertura). Mesmas regras da transferência.
CREATE OR REPLACE FUNCTION public.saldo_transferivel_portaria(_produto text)
RETURNS TABLE(data_operacao date, produto text, abertura_registrada boolean, cheios integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); k text := public._produto_chave(_produto); d date := public.data_operacional(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', _produto; END IF;
  RETURN QUERY SELECT d, k,
    EXISTS (SELECT 1 FROM public.movimentacoes_portaria m WHERE m.organization_id=o AND m.data_operacao=d AND m.tipo='abertura'),
    public._saldo_portaria_cheios(o, k, d);
END $$;
REVOKE ALL ON FUNCTION public.saldo_transferivel_portaria(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.saldo_transferivel_portaria(text) TO authenticated;
