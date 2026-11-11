-- G1 — 008 CANDIDATO: promissórias (criação manual, cobrador, recebimento), destino do dinheiro e acerto dos entregadores.
-- NÃO aplicar em produção sem aprovação explícita. Pressupõe 001 + 002 + 003 + 004 + 005 + 006 + 007.
-- Executar com psql -1 (transação única). Idempotente. Não reescreve registros existentes.
--
-- Regras aprovadas aplicadas: venda a prazo conta na data da venda e não é dinheiro; pagamento de promissória é
-- recebimento (não venda); parciais preservam cada recebimento e o saldo; nada se apaga.
--
-- Decisão 7 (destino do PIX/cartão e periodicidade do acerto) PENDENTE: nada aqui presume para onde foi um PIX ou
-- um cartão. Esses recebimentos ficam com destino 'nao_informado', aparecem no acerto só como informação e NÃO
-- entram no dinheiro a entregar nem são vinculados ao acerto. O acerto trata apenas o que é inequívoco: dinheiro
-- em espécie que ficou com o entregador.
--
-- 1. recebimentos.destino / responsavel_id / cobrador_id: onde o valor está.
--      'caixa'          dinheiro que entrou no caixa da portaria (venda de balcão; promissória paga na portaria);
--      'entregador'     dinheiro com o entregador (entrega ou venda na rua) até o acerto;
--      'cobrador'       dinheiro com o cobrador (promissória cobrada na rua) até prestar contas;
--      'nao_informado'  PIX/cartão (decisão 7).
--    Linhas anteriores ao 008 (só existem em laboratório; o banco publicado não tem a tabela) ficam com destino NULL
--    e são lidas pela regra derivada (_destino_efetivo).
-- 2. receber_promissoria: chave presa ao conteúdo, cobrador opcional (por ID), destino.
-- 3. criar_promissoria_manual e atribuir_cobrador: ações controladas (por ID, com reenvio seguro e histórico).
-- 4. Acerto: acerto_previa (leitura) e registrar_acerto (persistido, auditável, contra duplicação).
--    acertos_entregador deixa de aceitar gravação direta.

-- ───────────── 1. Estrutura (aditiva) ─────────────
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS destino text;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS responsavel_id uuid;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS cobrador_id uuid;
ALTER TABLE public.recebimentos DROP CONSTRAINT IF EXISTS recebimentos_destino_check;
ALTER TABLE public.recebimentos ADD CONSTRAINT recebimentos_destino_check
  CHECK (destino IS NULL OR destino IN ('caixa','entregador','cobrador','nao_informado'));
CREATE INDEX IF NOT EXISTS recebimentos_pendentes_acerto ON public.recebimentos(organization_id, responsavel_id) WHERE acerto_id IS NULL;

ALTER TABLE public.promissory_notes ADD COLUMN IF NOT EXISTS cobrador_id uuid;

ALTER TABLE public.acertos_entregador ADD COLUMN IF NOT EXISTS dinheiro_esperado numeric;
ALTER TABLE public.acertos_entregador ADD COLUMN IF NOT EXISTS dinheiro_entregue numeric;
ALTER TABLE public.acertos_entregador ADD COLUMN IF NOT EXISTS diferenca numeric;
ALTER TABLE public.acertos_entregador ADD COLUMN IF NOT EXISTS motivo_divergencia text;
ALTER TABLE public.acertos_entregador ADD COLUMN IF NOT EXISTS qtd_recebimentos integer;
ALTER TABLE public.acertos_entregador ADD COLUMN IF NOT EXISTS registrado_por uuid;

-- Acerto só por ação controlada (antes o operador podia inserir/alterar acertos direto).
DROP POLICY IF EXISTS "g1 operador cria" ON public.acertos_entregador;
DROP POLICY IF EXISTS "g1 operador altera" ON public.acertos_entregador;

-- ───────────── 2. Destino ─────────────
-- Regra para linhas sem destino gravado (anteriores ao 008).
CREATE OR REPLACE FUNCTION public._destino_efetivo(_destino text, _forma text, _origem text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(_destino, CASE
    WHEN _forma <> 'dinheiro' THEN 'nao_informado'
    WHEN _origem IN ('entrega','venda_rua') THEN 'entregador'
    ELSE 'caixa' END) $$;

-- Mesmo comportamento do 004 + destino: dinheiro de entrega/venda na rua fica com o entregador do pedido
-- (também quando a portaria registra a conclusão: o dinheiro só entra no caixa pelo acerto).
CREATE OR REPLACE FUNCTION public._registrar_pagamento(_org uuid, _order uuid, _origem text, _forma text, _valor numeric, _cliente uuid, _cliente_nome text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE f text := public._forma_chave(_forma); dest text; resp uuid; BEGIN
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
  END IF; END $$;
REVOKE ALL ON FUNCTION public._registrar_pagamento(uuid,uuid,text,text,numeric,uuid,text), public._destino_efetivo(text,text,text) FROM PUBLIC, anon, authenticated;

-- ───────────── 3. Promissórias ─────────────
CREATE OR REPLACE FUNCTION public._cobrador_valido(_org uuid, _cobrador uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE n text; BEGIN
  SELECT nome INTO n FROM public.colaboradores WHERE id=_cobrador AND organization_id=_org AND situacao='ativo';
  IF n IS NULL THEN RAISE EXCEPTION 'Cobrador inválido, inativo ou de outra empresa'; END IF;
  RETURN n; END $$;
REVOKE ALL ON FUNCTION public._cobrador_valido(uuid,uuid) FROM PUBLIC, anon, authenticated;

-- Recebimento (parcial ou total). Não é venda nova. _cobrador_id: quem cobrou na rua (o dinheiro fica com ele
-- até prestar contas); sem cobrador, dinheiro recebido na portaria entra no caixa.
DROP FUNCTION IF EXISTS public.receber_promissoria(uuid,numeric,text,text);
CREATE OR REPLACE FUNCTION public.receber_promissoria(_id uuid, _valor numeric, _forma text, _chave text, _cobrador_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); p record; pago numeric; rid uuid; prev uuid; h text; dest text; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _forma IS NULL OR _forma NOT IN ('dinheiro','pix','cartao') THEN RAISE EXCEPTION 'Forma de recebimento sem regra: %', _forma; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Recebimento exige chave de reenvio'; END IF;
  IF _cobrador_id IS NOT NULL THEN PERFORM public._cobrador_valido(o, _cobrador_id); END IF;
  h := md5(concat_ws('|', _id::text, round(coalesce(_valor,0),2)::text, _forma, coalesce(_cobrador_id::text,'')));
  prev := public._reenvio(o, _chave, 'receber_promissoria', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO p FROM public.promissory_notes WHERE id=_id AND organization_id=o FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Promissória não encontrada'; END IF;
  IF p.status IN ('paid','cancelled') THEN RAISE EXCEPTION 'Promissória já encerrada'; END IF;
  pago := coalesce(p.paid_amount,0);
  IF _valor IS NULL OR _valor <= 0 OR _valor > p.value - pago THEN RAISE EXCEPTION 'Valor deve ser maior que zero e no máximo o saldo (%)', p.value - pago; END IF;
  dest := CASE WHEN _forma <> 'dinheiro' THEN 'nao_informado' WHEN _cobrador_id IS NOT NULL THEN 'cobrador' ELSE 'caixa' END;
  INSERT INTO public.recebimentos(organization_id, origem, promissory_id, order_id, valor, forma, recebido_por, destino, responsavel_id, cobrador_id)
    VALUES (o, 'promissoria', _id, p.order_id, _valor, _forma, auth.uid(), dest, CASE WHEN dest='cobrador' THEN _cobrador_id END, _cobrador_id)
    RETURNING id INTO rid;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.promissory_notes SET paid_amount = pago + _valor, payment_method=_forma,
    status = CASE WHEN pago + _valor >= p.value THEN 'paid' ELSE 'parcial' END,
    paid_at = CASE WHEN pago + _valor >= p.value THEN now() ELSE NULL END WHERE id=_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, rid);
  RETURN rid; END $$;
REVOKE ALL ON FUNCTION public.receber_promissoria(uuid,numeric,text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.receber_promissoria(uuid,numeric,text,text,uuid) TO authenticated;

-- Promissória sem venda no sistema (dívida anterior, acordo). Não é venda nem recebimento: só entra no saldo a receber.
CREATE OR REPLACE FUNCTION public.criar_promissoria_manual(_cliente_id uuid, _cliente_nome text, _valor numeric, _vencimento date,
  _cobrador_id uuid, _observacoes text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; nid uuid; h text; nome text := btrim(coalesce(_cliente_nome,'')); cob text; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Promissória exige chave de reenvio'; END IF;
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Valor deve ser maior que zero'; END IF;
  IF _vencimento IS NULL THEN RAISE EXCEPTION 'Informe o vencimento'; END IF;
  IF _cliente_id IS NOT NULL THEN
    SELECT name INTO nome FROM public.clients WHERE id=_cliente_id AND organization_id=o;
    IF nome IS NULL THEN RAISE EXCEPTION 'Cliente de outra empresa ou inexistente'; END IF;
  END IF;
  IF length(nome) < 3 THEN RAISE EXCEPTION 'Identifique o cliente'; END IF;
  IF _cobrador_id IS NOT NULL THEN cob := public._cobrador_valido(o, _cobrador_id); END IF;
  h := md5(concat_ws('|', coalesce(_cliente_id::text,''), nome, round(_valor,2)::text, _vencimento::text, coalesce(_cobrador_id::text,''), coalesce(btrim(_observacoes),'')));
  prev := public._reenvio(o, _chave, 'criar_promissoria_manual', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  INSERT INTO public.promissory_notes(organization_id, client_id, client_name, value, due_date, status, assigned_to, cobrador_id, created_by, notes)
    VALUES (o, _cliente_id, nome, round(_valor,2), _vencimento, CASE WHEN _cobrador_id IS NULL THEN 'pending' ELSE 'assigned' END, cob, _cobrador_id,
            auth.uid(), coalesce(nullif(btrim(_observacoes),''), 'Promissória manual (sem venda no sistema)'))
    RETURNING id INTO nid;
  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'promissory_notes', nid, '{}'::jsonb, jsonb_build_object('valor', round(_valor,2), 'vencimento', _vencimento, 'cliente', nome),
            'Promissória manual', auth.uid());
  PERFORM public._reenvio_fim(o, _chave, nid);
  RETURN nid; END $$;
REVOKE ALL ON FUNCTION public.criar_promissoria_manual(uuid,text,numeric,date,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_promissoria_manual(uuid,text,numeric,date,uuid,text,text) TO authenticated;

-- Atribui (ou retira, com NULL) o cobrador por ID. Não mexe em valor nem em pagamentos; 'parcial' continua 'parcial'.
CREATE OR REPLACE FUNCTION public.atribuir_cobrador(_id uuid, _cobrador_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); p record; cob text; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _cobrador_id IS NOT NULL THEN cob := public._cobrador_valido(o, _cobrador_id); END IF;
  SELECT * INTO p FROM public.promissory_notes WHERE id=_id AND organization_id=o FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Promissória não encontrada'; END IF;
  IF p.status IN ('paid','cancelled') THEN RAISE EXCEPTION 'Promissória já encerrada'; END IF;
  UPDATE public.promissory_notes SET cobrador_id=_cobrador_id, assigned_to=cob,
    status = CASE WHEN p.status IN ('pending','overdue','assigned') THEN (CASE WHEN _cobrador_id IS NULL THEN 'pending' ELSE 'assigned' END) ELSE p.status END
    WHERE id=_id;
  RETURN _id; END $$;
REVOKE ALL ON FUNCTION public.atribuir_cobrador(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atribuir_cobrador(uuid,uuid) TO authenticated;

-- ───────────── 4. Acerto dos entregadores ─────────────
-- Prévia: o que está pendente de acerto com o entregador. 'entregar' = dinheiro em espécie a entregar;
-- 'informativo' = PIX/cartão das vendas dele, destino não decidido (não entra no valor a entregar).
CREATE OR REPLACE FUNCTION public.acerto_previa(_entregador_id uuid)
RETURNS TABLE(categoria text, forma text, qtd integer, total numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_entregador_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Entregador de outra empresa' USING ERRCODE='42501'; END IF;
  RETURN QUERY
    SELECT 'entregar'::text, r.forma, count(*)::int, coalesce(sum(r.valor),0)
      FROM public.recebimentos r
     WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.forma='dinheiro'
       AND public._destino_efetivo(r.destino, r.forma, r.origem)='entregador'
       AND coalesce(r.responsavel_id, r.recebido_por)=_entregador_id
     GROUP BY r.forma
    UNION ALL
    SELECT 'informativo'::text, r.forma, count(*)::int, coalesce(sum(r.valor),0)
      FROM public.recebimentos r JOIN public.orders ord ON ord.id=r.order_id
     WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.forma<>'dinheiro'
       AND r.origem IN ('entrega','venda_rua') AND ord.delivery_person_id=_entregador_id
     GROUP BY r.forma;
END $$;

-- Registra o acerto: o dinheiro pendente do entregador é conferido contra o valor entregue.
-- Persistido em acertos_entregador; os recebimentos acertados ficam vinculados (acerto_id) e não entram de novo.
-- Diferença exige motivo e fica registrada como 'divergente'. Reenvio com a mesma chave devolve o mesmo acerto.
CREATE OR REPLACE FUNCTION public.registrar_acerto(_entregador_id uuid, _dinheiro_entregue numeric, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; h text; aid uuid; esperado numeric; n integer; nome text; dif numeric;
  pix numeric; cartao numeric; qe integer; qr integer; ids uuid[]; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Acerto exige chave de reenvio'; END IF;
  IF _dinheiro_entregue IS NULL OR _dinheiro_entregue < 0 THEN RAISE EXCEPTION 'Informe o dinheiro entregue (zero ou mais)'; END IF;
  SELECT p.name INTO nome FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
   WHERE p.id=_entregador_id AND p.organization_id=o;
  IF nome IS NULL THEN RAISE EXCEPTION 'Entregador inválido ou de outra empresa'; END IF;  -- inativo ainda acerta o que deve
  h := md5(concat_ws('|', _entregador_id::text, round(_dinheiro_entregue,2)::text, coalesce(btrim(_motivo),'')));
  prev := public._reenvio(o, _chave, 'registrar_acerto', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  -- Um acerto por vez por entregador.
  PERFORM pg_advisory_xact_lock(hashtextextended('g1.acerto|' || o || '|' || _entregador_id, 0));
  -- Trava as linhas pendentes e guarda exatamente quais entram neste acerto (a mesma lista soma e é vinculada).
  PERFORM 1 FROM public.recebimentos r
   WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.forma='dinheiro'
     AND public._destino_efetivo(r.destino, r.forma, r.origem)='entregador'
     AND coalesce(r.responsavel_id, r.recebido_por)=_entregador_id
   FOR UPDATE;
  SELECT coalesce(array_agg(r.id), '{}'), coalesce(sum(r.valor),0), count(*) INTO ids, esperado, n
    FROM public.recebimentos r
   WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.forma='dinheiro'
     AND public._destino_efetivo(r.destino, r.forma, r.origem)='entregador'
     AND coalesce(r.responsavel_id, r.recebido_por)=_entregador_id;
  IF n = 0 AND _dinheiro_entregue = 0 THEN RAISE EXCEPTION 'Nada a acertar: não há dinheiro pendente com este entregador'; END IF;
  dif := round(_dinheiro_entregue - esperado, 2);
  IF dif <> 0 AND coalesce(length(btrim(_motivo)),0) < 5 THEN
    RAISE EXCEPTION 'Valor entregue (%) diferente do esperado (%): informe o motivo', _dinheiro_entregue, esperado; END IF;
  SELECT coalesce(sum(r.valor) FILTER (WHERE r.forma='pix'),0), coalesce(sum(r.valor) FILTER (WHERE r.forma='cartao'),0)
    INTO pix, cartao
    FROM public.recebimentos r JOIN public.orders ord ON ord.id=r.order_id
   WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.forma<>'dinheiro' AND r.origem IN ('entrega','venda_rua')
     AND ord.delivery_person_id=_entregador_id;
  SELECT count(DISTINCT r.order_id) FILTER (WHERE r.origem='entrega'), count(DISTINCT r.order_id) FILTER (WHERE r.origem='venda_rua')
    INTO qe, qr FROM public.recebimentos r WHERE r.id = ANY(ids);
  INSERT INTO public.acertos_entregador(organization_id, entregador_id, entregador_nome, data, total_dinheiro, total_pix, total_cartao, total_geral,
      qtd_entregas, qtd_vendas_rua, conferido_por, conferido_em, status, observacoes,
      dinheiro_esperado, dinheiro_entregue, diferenca, motivo_divergencia, qtd_recebimentos, registrado_por)
    VALUES (o, _entregador_id, nome, public.data_operacional(), esperado, pix, cartao, esperado + pix + cartao,
      coalesce(qe,0), coalesce(qr,0), auth.uid(), now(), CASE WHEN dif = 0 THEN 'conferido' ELSE 'divergente' END,
      'PIX e cartão: informativos (destino pendente da decisão 7)',
      esperado, round(_dinheiro_entregue,2), dif, CASE WHEN dif <> 0 THEN btrim(_motivo) END, n, auth.uid())
    RETURNING id INTO aid;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.recebimentos SET acerto_id = aid WHERE id = ANY(ids);
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, aid);
  RETURN aid; END $$;

REVOKE ALL ON FUNCTION public.acerto_previa(uuid), public.registrar_acerto(uuid,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acerto_previa(uuid), public.registrar_acerto(uuid,numeric,text,text) TO authenticated;

-- ───────────── 5. Dinheiro aguardando acerto (painel) ─────────────
-- Uma linha por responsável com dinheiro fora do caixa (entregador ou cobrador). Só operador/admin.
CREATE OR REPLACE FUNCTION public.dinheiro_aguardando_acerto()
RETURNS TABLE(destino text, responsavel_id uuid, responsavel_nome text, qtd integer, total numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY
    SELECT d.dest, d.resp, coalesce(pr.name, c.nome, '—'), count(*)::int, sum(d.valor)
      FROM (SELECT public._destino_efetivo(r.destino, r.forma, r.origem) AS dest,
                   CASE WHEN public._destino_efetivo(r.destino, r.forma, r.origem)='cobrador' THEN r.cobrador_id
                        ELSE coalesce(r.responsavel_id, r.recebido_por) END AS resp, r.valor
              FROM public.recebimentos r
             WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.forma='dinheiro') d
      LEFT JOIN public.profiles pr ON pr.id = d.resp AND d.dest='entregador'
      LEFT JOIN public.colaboradores c ON c.id = d.resp AND d.dest='cobrador'
     WHERE d.dest IN ('entregador','cobrador')
     GROUP BY d.dest, d.resp, pr.name, c.nome
     ORDER BY 5 DESC;
END $$;
REVOKE ALL ON FUNCTION public.dinheiro_aguardando_acerto() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dinheiro_aguardando_acerto() TO authenticated;
