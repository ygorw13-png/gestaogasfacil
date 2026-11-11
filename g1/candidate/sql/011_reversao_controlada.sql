-- G1 011 CANDIDATO — Decisão B: reversão controlada (regra aprovada pelo proprietário em 11/11/2026).
-- Aplicar depois de 001..010. Cria tabelas e colunas novas (anuláveis), amplia tipos de movimento e
-- substitui funções. Não altera nem apaga registros existentes.
-- Primeira entrega: cancelamento de pedido, devolução integral, troca integral por problema, duplicidade.
-- Devolução parcial: recusada com explicação. Diferença de preço na troca e decisão 13: fora.

-- ───────────── 1. Tipos de movimento e marcação de recebimento anulado ─────────────
ALTER TABLE public.carga_movimentos DROP CONSTRAINT IF EXISTS carga_movimentos_tipo_check;
ALTER TABLE public.carga_movimentos ADD CONSTRAINT carga_movimentos_tipo_check CHECK (tipo = ANY (ARRAY[
  'saida_portaria','consumo_entrega','consumo_venda_rua','devolucao','reversao','correcao_duplicidade']));
ALTER TABLE public.movimentacoes_portaria DROP CONSTRAINT IF EXISTS movimentacoes_portaria_tipo_check;
ALTER TABLE public.movimentacoes_portaria ADD CONSTRAINT movimentacoes_portaria_tipo_check CHECK (tipo = ANY (ARRAY[
  'abertura','transferencia_patio_para_portaria','transferencia_portaria_para_patio','venda','venda_comodato',
  'devolucao_vasilhame','fechamento','ajuste','sangria_despesa','entrada_patio','ajuste_patio','saida_carga','retorno_carga',
  'reversao','correcao_duplicidade']));
-- Recebimento de lançamento duplicado cujo pagamento NÃO aconteceu: fica no histórico, marcado, fora dos totais.
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS anulado_reversao_id uuid;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS anulado_em timestamptz;

-- ───────────── 2. Tabelas da reversão ─────────────
CREATE TABLE IF NOT EXISTS public.reversoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  order_valida_id uuid REFERENCES public.orders(id),
  tipo text NOT NULL CHECK (tipo IN ('cancelamento','devolucao','troca','duplicidade')),
  status text NOT NULL DEFAULT 'solicitada'
    CHECK (status IN ('solicitada','aguardando_retorno','reembolso_pendente','concluida','recusada')),
  motivo text NOT NULL,
  solicitado_por uuid NOT NULL,
  solicitado_por_nome text,
  solicitado_em timestamptz NOT NULL DEFAULT now(),
  decidido_por uuid,
  decidido_por_nome text,
  decidido_em timestamptz,
  recusa_motivo text,
  data_operacao date,
  pagamento_duplicado boolean,
  -- cópia da venda original no momento da solicitação (a venda não é reescrita)
  produto text, quantidade integer, tipo_venda text, valor_venda numeric, status_pedido text, data_venda timestamptz,
  esperado_cheios integer NOT NULL DEFAULT 0,
  esperado_vazios_recolher integer NOT NULL DEFAULT 0,
  esperado_vazios_cliente integer NOT NULL DEFAULT 0,
  esperado_emprestados integer NOT NULL DEFAULT 0,
  esperado_substituto integer NOT NULL DEFAULT 0,
  confirmado_cheios integer NOT NULL DEFAULT 0,
  confirmado_vazios_recolher integer NOT NULL DEFAULT 0,
  confirmado_vazios_cliente integer NOT NULL DEFAULT 0,
  confirmado_emprestados integer NOT NULL DEFAULT 0,
  confirmado_substituto integer NOT NULL DEFAULT 0,
  promissoria_cancelada numeric NOT NULL DEFAULT 0,
  valor_reembolso numeric NOT NULL DEFAULT 0,
  valor_reembolsado numeric NOT NULL DEFAULT 0,
  efeitos jsonb NOT NULL DEFAULT '[]'::jsonb,
  concluido_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reversoes_fisico_limite CHECK (confirmado_cheios <= esperado_cheios
    AND confirmado_vazios_recolher <= esperado_vazios_recolher AND confirmado_vazios_cliente <= esperado_vazios_cliente
    AND confirmado_emprestados <= esperado_emprestados AND confirmado_substituto <= esperado_substituto),
  CONSTRAINT reversoes_reembolso_limite CHECK (valor_reembolsado <= valor_reembolso)
);
CREATE UNIQUE INDEX IF NOT EXISTS reversoes_uma_ativa ON public.reversoes(order_id)
  WHERE status IN ('solicitada','aguardando_retorno','reembolso_pendente');
CREATE UNIQUE INDEX IF NOT EXISTS reversoes_uma_definitiva ON public.reversoes(order_id)
  WHERE status <> 'recusada' AND tipo <> 'troca';
CREATE INDEX IF NOT EXISTS reversoes_org_status ON public.reversoes(organization_id, status);

CREATE TABLE IF NOT EXISTS public.reversao_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  reversao_id uuid NOT NULL REFERENCES public.reversoes(id),
  tipo text NOT NULL CHECK (tipo IN ('recolhimento','saida','correcao_duplicidade','liberacao_conferencia')),
  local text NOT NULL CHECK (local IN ('portaria','carga')),
  carga_id uuid,
  produto text NOT NULL,
  cheios integer NOT NULL DEFAULT 0,
  vazios integer NOT NULL DEFAULT 0,
  emprestados integer NOT NULL DEFAULT 0,
  substituto integer NOT NULL DEFAULT 0,
  vazios_cliente integer NOT NULL DEFAULT 0,
  condicao text,
  observacoes text,
  movimento_id uuid,
  registrado_por uuid NOT NULL,
  registrado_por_nome text,
  data_operacao date NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.itens_conferencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  reversao_id uuid NOT NULL REFERENCES public.reversoes(id),
  local text NOT NULL CHECK (local IN ('portaria','carga')),
  carga_id uuid,
  produto text NOT NULL,
  cheios integer NOT NULL DEFAULT 0 CHECK (cheios >= 0),
  vazios integer NOT NULL DEFAULT 0 CHECK (vazios >= 0),
  condicao text NOT NULL,
  status text NOT NULL DEFAULT 'em_conferencia' CHECK (status IN ('em_conferencia','liberado','baixado')),
  motivo_resolucao text,
  resolvido_por uuid,
  resolvido_em timestamptz,
  registrado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reembolsos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  reversao_id uuid NOT NULL REFERENCES public.reversoes(id),
  order_id uuid NOT NULL,
  recebimento_id uuid NOT NULL,
  forma text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','realizado')),
  origem text CHECK (origem IS NULL OR origem IN ('caixa','entregador','cobrador','conta_empresa')),
  responsavel_id uuid,
  referencia text,
  acerto_original_id uuid,
  acerto_id uuid,
  realizado_por uuid,
  realizado_por_nome text,
  realizado_em timestamptz,
  data_operacao date,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reembolsos_um_por_recebimento UNIQUE (recebimento_id)
);

GRANT SELECT ON public.reversoes, public.reversao_movimentos, public.itens_conferencia, public.reembolsos TO authenticated;
GRANT ALL ON public.reversoes, public.reversao_movimentos, public.itens_conferencia, public.reembolsos TO service_role;
ALTER TABLE public.reversoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reversao_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_conferencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reembolsos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "g1 operador le" ON public.reversoes;
CREATE POLICY "g1 operador le" ON public.reversoes FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());
DROP POLICY IF EXISTS "g1 entregador le reversoes suas" ON public.reversoes;
CREATE POLICY "g1 entregador le reversoes suas" ON public.reversoes FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_entregador() AND (solicitado_por = auth.uid()
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = reversoes.order_id AND o.delivery_person_id = auth.uid())));
DROP POLICY IF EXISTS "g1 operador le" ON public.reversao_movimentos;
CREATE POLICY "g1 operador le" ON public.reversao_movimentos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());
DROP POLICY IF EXISTS "g1 entregador le os seus" ON public.reversao_movimentos;
CREATE POLICY "g1 entregador le os seus" ON public.reversao_movimentos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_entregador() AND registrado_por = auth.uid());
DROP POLICY IF EXISTS "g1 operador le" ON public.itens_conferencia;
CREATE POLICY "g1 operador le" ON public.itens_conferencia FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());
DROP POLICY IF EXISTS "g1 operador le" ON public.reembolsos;
CREATE POLICY "g1 operador le" ON public.reembolsos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());

-- ───────────── 3. Auxiliares ─────────────
CREATE OR REPLACE FUNCTION public._meu_nome() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT name FROM public.profiles WHERE id = auth.uid() $$;

-- Recalcula andamento: físico pendente > reembolso pendente > concluída.
CREATE OR REPLACE FUNCTION public._reversao_atualizar(_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE s text; BEGIN
  UPDATE public.reversoes v SET
    valor_reembolsado = (SELECT coalesce(sum(valor),0) FROM public.reembolsos WHERE reversao_id=v.id AND status='realizado'),
    status = CASE WHEN v.status IN ('solicitada','recusada') THEN v.status
      WHEN v.confirmado_cheios < v.esperado_cheios OR v.confirmado_vazios_recolher < v.esperado_vazios_recolher
        OR v.confirmado_vazios_cliente < v.esperado_vazios_cliente OR v.confirmado_substituto < v.esperado_substituto
        OR v.confirmado_emprestados < v.esperado_emprestados THEN 'aguardando_retorno'
      WHEN EXISTS (SELECT 1 FROM public.reembolsos WHERE reversao_id=v.id AND status='pendente') THEN 'reembolso_pendente'
      ELSE 'concluida' END,
    atualizado_em = now()
  WHERE v.id=_id RETURNING v.status INTO s;
  UPDATE public.reversoes SET concluido_em = coalesce(concluido_em, now()) WHERE id=_id AND status='concluida';
  RETURN s; END $$;

-- Efeitos de estoque comprovadamente gravados pela venda (baixa da portaria ou consumo da carga ligados ao pedido).
CREATE OR REPLACE FUNCTION public._reversao_vinculos(_org uuid, _order uuid,
  OUT n integer, OUT cheios integer, OUT vazios_recebidos integer, OUT vazios_vendidos integer, OUT emprestados integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT count(*)::int, coalesce(sum(-x.dc),0)::int, coalesce(sum(x.dv) FILTER (WHERE x.dv > 0),0)::int,
         coalesce(sum(-x.dv) FILTER (WHERE x.dv < 0),0)::int, coalesce(sum(x.de) FILTER (WHERE x.de > 0),0)::int
    FROM (SELECT delta_cheios dc, delta_vazios dv, delta_emprestados de FROM public.movimentacoes_portaria
           WHERE organization_id=_org AND referencia_id=_order AND tipo IN ('venda','venda_comodato')
          UNION ALL
          SELECT delta_cheios, delta_vazios, delta_emprestados FROM public.carga_movimentos
           WHERE organization_id=_org AND order_id=_order AND tipo IN ('consumo_entrega','consumo_venda_rua')) x $$;

-- Autoriza e grava, numa transação, os efeitos calculados. Chamado só pelas ações abaixo (que conferem o papel).
CREATE OR REPLACE FUNCTION public._reversao_autorizar(_id uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE r public.reversoes%ROWTYPE; ord public.orders%ROWTYPE; o uuid; lk record; rc record; pn record; m record;
  hoje date := public.data_operacional(); efe jsonb := '[]'::jsonb; total numeric := 0; canc numeric := 0; saldo numeric;
  antes text := coalesce(current_setting('g1.acao_controlada',true),''); ref_fin boolean := true; BEGIN
  SELECT * INTO r FROM public.reversoes WHERE id=_id FOR UPDATE;
  IF r.status <> 'solicitada' THEN RAISE EXCEPTION 'Reversão já decidida (situação: %)', r.status; END IF;
  o := r.organization_id;
  SELECT * INTO ord FROM public.orders WHERE id=r.order_id AND organization_id=o FOR UPDATE;
  PERFORM set_config('g1.acao_controlada','on',true);

  IF r.tipo = 'cancelamento' THEN
    IF ord.status IN ('completed','delivered') THEN
      RAISE EXCEPTION 'Pedido já concluído: use devolução integral, troca por problema ou duplicidade'; END IF;
    IF ord.status = 'cancelled' THEN RAISE EXCEPTION 'Pedido já cancelado'; END IF;
    UPDATE public.orders SET status='cancelled',
      notes = concat_ws(' | ', nullif(btrim(coalesce(notes,'')),''), 'CANCELADO por reversão: ' || r.motivo) WHERE id=ord.id;
    IF EXISTS (SELECT 1 FROM public.carga_movimentos WHERE order_id=ord.id AND tipo='saida_portaria') THEN
      efe := efe || jsonb_build_array('Produto já transferido para a carga continua na carga; volta à portaria só pela devolução da carga');
    ELSE
      efe := efe || jsonb_build_array('Pedido sem saída de produto: estoque não movimentado');
    END IF;

  ELSIF r.tipo = 'troca' THEN
    IF ord.status NOT IN ('completed','delivered') THEN RAISE EXCEPTION 'Troca só de venda concluída'; END IF;
    UPDATE public.reversoes SET esperado_cheios = coalesce(ord.quantity,1), esperado_substituto = coalesce(ord.quantity,1) WHERE id=_id;
    efe := efe || jsonb_build_array('Troca sem cobrança: receita, promissória e recebimentos da venda ficam como estão');
    ref_fin := false;

  ELSE -- devolucao | duplicidade
    IF ord.status NOT IN ('completed','delivered') THEN RAISE EXCEPTION 'Só venda concluída'; END IF;
    lk := public._reversao_vinculos(o, ord.id);
    IF lk.n = 0 THEN
      RAISE EXCEPTION 'Venda sem vínculo de estoque (registrada antes das ações controladas): faltam a baixa da portaria ou o consumo da carga ligados a ela. Reversão automática bloqueada';
    END IF;
    IF coalesce(ord.price,0) > 0 AND public._forma_chave(ord.payment_method) IS DISTINCT FROM 'promissoria'
       AND NOT EXISTS (SELECT 1 FROM public.recebimentos WHERE order_id=ord.id)
       AND NOT EXISTS (SELECT 1 FROM public.promissory_notes WHERE order_id=ord.id)
       AND NOT EXISTS (SELECT 1 FROM public.divergencias WHERE order_id=ord.id) THEN
      RAISE EXCEPTION 'Venda sem recebimento nem promissória registrados: não dá para saber o que foi pago. Reversão automática bloqueada';
    END IF;
    IF r.tipo = 'devolucao' THEN
      UPDATE public.reversoes SET esperado_cheios=lk.cheios, esperado_vazios_cliente=lk.vazios_recebidos,
        esperado_vazios_recolher=lk.vazios_vendidos, esperado_emprestados=least(lk.emprestados, lk.cheios) WHERE id=_id;
    ELSE
      -- duplicidade: corrige só o que o lançamento indevido gravou; nada de coleta física.
      IF r.pagamento_duplicado IS NULL AND EXISTS (SELECT 1 FROM public.recebimentos
          WHERE order_id=ord.id AND origem IN ('venda','entrega','venda_rua') AND anulado_em IS NULL) THEN
        RAISE EXCEPTION 'Informe se o pagamento duplicado aconteceu (o cliente pagou duas vezes?)'; END IF;
      FOR m IN SELECT * FROM public.movimentacoes_portaria WHERE organization_id=o AND referencia_id=ord.id AND tipo IN ('venda','venda_comodato') LOOP
        IF m.data_operacao = hoje THEN
          PERFORM public.registrar_movimentacao_portaria('correcao_duplicidade', m.produto, -m.delta_cheios, -m.delta_vazios, -m.delta_emprestados,
            ord.client_id, ord.client_name, r.id, 'Correção de lançamento duplicado (pedido ' || left(ord.id::text,8) || ')', hoje);
          efe := efe || jsonb_build_array(format('Portaria de hoje corrigida: %s cheio(s), %s vazio(s)', -m.delta_cheios, -m.delta_vazios));
        ELSE
          efe := efe || jsonb_build_array(format('Baixa da portaria de %s não ajustada: dia já encerrado, vale a contagem da abertura seguinte', to_char(m.data_operacao,'DD/MM/YYYY')));
        END IF;
      END LOOP;
      FOR m IN SELECT cm.*, c.status AS carga_status FROM public.carga_movimentos cm JOIN public.cargas c ON c.id=cm.carga_id
                WHERE cm.organization_id=o AND cm.order_id=ord.id AND cm.tipo IN ('consumo_entrega','consumo_venda_rua') LOOP
        IF m.carga_status = 'aberta' THEN
          INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados, order_id, registrado_por)
            VALUES (o, m.carga_id, 'correcao_duplicidade', m.produto, -m.delta_cheios, -m.delta_vazios, -m.delta_emprestados, ord.id, auth.uid());
          efe := efe || jsonb_build_array(format('Carga corrigida: %s cheio(s), %s vazio(s)', -m.delta_cheios, -m.delta_vazios));
        ELSE
          efe := efe || jsonb_build_array('Consumo em carga já encerrada não ajustado');
        END IF;
      END LOOP;
      IF r.pagamento_duplicado IS NOT TRUE THEN
        FOR rc IN SELECT * FROM public.recebimentos WHERE order_id=ord.id AND organization_id=o
                   AND origem IN ('venda','entrega','venda_rua') AND anulado_em IS NULL FOR UPDATE LOOP
          IF rc.acerto_id IS NOT NULL THEN
            RAISE EXCEPTION 'O recebimento de R$ % deste lançamento já entrou num acerto do entregador: não dá para anular com segurança. Confira o acerto antes', rc.valor;
          END IF;
          UPDATE public.recebimentos SET anulado_reversao_id=r.id, anulado_em=now() WHERE id=rc.id;
          efe := efe || jsonb_build_array(format('Recebimento de R$ %s anulado: o pagamento duplicado não aconteceu', rc.valor));
        END LOOP;
      END IF;
    END IF;
  END IF;

  IF ref_fin THEN
    -- 1º as promissórias (trava contra recebimento simultâneo), depois os recebimentos.
    FOR pn IN SELECT * FROM public.promissory_notes WHERE order_id=ord.id AND organization_id=o
               AND status NOT IN ('paid','cancelled') FOR UPDATE LOOP
      saldo := round(pn.value - coalesce(pn.paid_amount,0), 2);
      UPDATE public.promissory_notes SET status='cancelled',
        notes = concat_ws(' | ', nullif(btrim(coalesce(notes,'')),''), format('Saldo de R$ %s cancelado pela reversão %s', saldo, left(r.id::text,8)))
       WHERE id=pn.id;
      canc := canc + saldo;
    END LOOP;
    IF canc > 0 THEN efe := efe || jsonb_build_array(format('Cobrança do saldo de R$ %s cancelada (recebimentos anteriores preservados)', canc)); END IF;
    FOR rc IN SELECT * FROM public.recebimentos WHERE order_id=ord.id AND organization_id=o AND anulado_em IS NULL
               AND NOT EXISTS (SELECT 1 FROM public.reembolsos e WHERE e.recebimento_id=recebimentos.id) FOR UPDATE LOOP
      INSERT INTO public.reembolsos(organization_id, reversao_id, order_id, recebimento_id, forma, valor, acerto_original_id)
        VALUES (o, r.id, ord.id, rc.id, rc.forma, rc.valor, rc.acerto_id);
      total := total + rc.valor;
    END LOOP;
    IF total > 0 THEN efe := efe || jsonb_build_array(format('R$ %s a reembolsar (pendente até a devolução ser confirmada)', total)); END IF;
  END IF;

  UPDATE public.reversoes SET decidido_por=auth.uid(), decidido_por_nome=public._meu_nome(), decidido_em=now(), data_operacao=hoje,
    status='aguardando_retorno', valor_reembolso=total, promissoria_cancelada=canc, efeitos=efeitos || efe WHERE id=_id;
  PERFORM set_config('g1.acao_controlada',antes,true);
  RETURN public._reversao_atualizar(_id);
END $$;

-- ───────────── 4. Ações ─────────────
CREATE OR REPLACE FUNCTION public.reversao_solicitar(_order_id uuid, _tipo text, _motivo text, _order_valida_id uuid,
  _pagamento_duplicado boolean, _autorizar boolean, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); ope boolean := public.is_operador(); ent boolean := public.is_entregador();
  ord public.orders%ROWTYPE; prev uuid; rid uuid; h text; BEGIN
  IF NOT (ope OR ent) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Reversão exige chave de reenvio'; END IF;
  IF lower(coalesce(_tipo,'')) IN ('devolucao_parcial','parcial') THEN
    RAISE EXCEPTION 'Devolução parcial ainda não está disponível. Nesta etapa: cancelamento de pedido, devolução integral, troca integral por problema ou duplicidade';
  END IF;
  IF _tipo IS NULL OR _tipo NOT IN ('cancelamento','devolucao','troca','duplicidade') THEN RAISE EXCEPTION 'Tipo de reversão inválido: %', _tipo; END IF;
  IF coalesce(length(btrim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 letras)'; END IF;
  IF coalesce(_autorizar,false) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Só o administrador autoriza reversão' USING ERRCODE='42501'; END IF;
  h := md5(concat_ws('|', _order_id::text, _tipo, btrim(_motivo), coalesce(_order_valida_id::text,''),
        coalesce(_pagamento_duplicado::text,''), coalesce(_autorizar,false)::text));
  prev := public._reenvio(o, _chave, 'reversao_solicitar', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO ord FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF ord.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF NOT ope AND ord.delivery_person_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Entregador só solicita reversão de entregas e vendas suas' USING ERRCODE='42501'; END IF;
  IF _tipo = 'cancelamento' THEN
    IF ord.status IN ('completed','delivered') THEN RAISE EXCEPTION 'Pedido já concluído: use devolução integral, troca por problema ou duplicidade'; END IF;
    IF ord.status = 'cancelled' THEN RAISE EXCEPTION 'Pedido já cancelado'; END IF;
  ELSIF ord.status NOT IN ('completed','delivered') THEN
    RAISE EXCEPTION 'Devolução, troca e duplicidade só de venda concluída (situação: %)', ord.status;
  END IF;
  IF _tipo = 'troca' AND ord.tipo_venda = 'vasilhame' THEN RAISE EXCEPTION 'Troca de vasilhame vendido não está incluída nesta etapa'; END IF;
  IF _tipo = 'duplicidade' THEN
    IF _order_valida_id IS NULL OR _order_valida_id = _order_id THEN RAISE EXCEPTION 'Informe a venda válida (a que fica)'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id=_order_valida_id AND organization_id=o AND status IN ('completed','delivered')) THEN
      RAISE EXCEPTION 'Venda válida não encontrada ou não concluída'; END IF;
    IF EXISTS (SELECT 1 FROM public.reversoes WHERE order_id=_order_valida_id AND tipo IN ('duplicidade','devolucao') AND status <> 'recusada') THEN
      RAISE EXCEPTION 'A venda indicada como válida já tem reversão registrada'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.reversoes WHERE order_id=_order_id AND status IN ('solicitada','aguardando_retorno','reembolso_pendente')) THEN
    RAISE EXCEPTION 'Já existe reversão em andamento para este pedido'; END IF;
  IF EXISTS (SELECT 1 FROM public.reversoes WHERE order_id=_order_id AND status <> 'recusada' AND tipo <> 'troca') THEN
    RAISE EXCEPTION 'Este pedido já tem reversão registrada'; END IF;
  INSERT INTO public.reversoes(organization_id, order_id, order_valida_id, tipo, motivo, solicitado_por, solicitado_por_nome,
      pagamento_duplicado, produto, quantidade, tipo_venda, valor_venda, status_pedido, data_venda)
    VALUES (o, ord.id, CASE WHEN _tipo='duplicidade' THEN _order_valida_id END, _tipo, btrim(_motivo), auth.uid(), public._meu_nome(),
      CASE WHEN _tipo='duplicidade' THEN _pagamento_duplicado END, ord.product, ord.quantity, ord.tipo_venda, ord.price, ord.status,
      coalesce(ord.delivered_at, ord.created_at))
    RETURNING id INTO rid;
  IF coalesce(_autorizar,false) THEN PERFORM public._reversao_autorizar(rid); END IF;
  PERFORM public._reenvio_fim(o, _chave, rid);
  RETURN rid; END $$;

CREATE OR REPLACE FUNCTION public.reversao_autorizar(_id uuid, _pagamento_duplicado boolean, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; oid uuid; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador autoriza reversão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Autorização exige chave de reenvio'; END IF;
  prev := public._reenvio(o, _chave, 'reversao_autorizar', md5(concat_ws('|', _id::text, coalesce(_pagamento_duplicado::text,''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT order_id INTO oid FROM public.reversoes WHERE id=_id AND organization_id=o;
  IF oid IS NULL THEN RAISE EXCEPTION 'Reversão não encontrada'; END IF;
  PERFORM 1 FROM public.orders WHERE id=oid FOR UPDATE;  -- mesma ordem de trava da solicitação: pedido, depois reversão
  UPDATE public.reversoes SET pagamento_duplicado = coalesce(_pagamento_duplicado, pagamento_duplicado)
   WHERE id=_id AND tipo='duplicidade' AND status='solicitada';
  PERFORM public._reversao_autorizar(_id);
  PERFORM public._reenvio_fim(o, _chave, _id);
  RETURN _id; END $$;

CREATE OR REPLACE FUNCTION public.reversao_recusar(_id uuid, _motivo text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; r public.reversoes%ROWTYPE; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador decide reversão' USING ERRCODE='42501'; END IF;
  IF coalesce(length(btrim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 letras)'; END IF;
  prev := public._reenvio(o, _chave, 'reversao_recusar', md5(concat_ws('|', _id::text, btrim(_motivo)))); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.reversoes WHERE id=_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Reversão não encontrada'; END IF;
  IF r.status <> 'solicitada' THEN RAISE EXCEPTION 'Só solicitação ainda não decidida pode ser recusada (situação: %)', r.status; END IF;
  UPDATE public.reversoes SET status='recusada', recusa_motivo=btrim(_motivo), decidido_por=auth.uid(), decidido_por_nome=public._meu_nome(),
    decidido_em=now(), atualizado_em=now() WHERE id=_id;
  PERFORM public._reenvio_fim(o, _chave, _id);
  RETURN _id; END $$;

-- Fato físico confirmado: recolhimento (cheio/vazio) e saída (substituto da troca, vazio devolvido ao cliente).
CREATE OR REPLACE FUNCTION public.reversao_confirmar_fisico(_id uuid, _local text, _carga_id uuid, _cheios integer, _vazios_recolhidos integer,
  _vazios_cliente integer, _substituto integer, _condicao text, _observacoes text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); ope boolean := public.is_operador(); ent boolean := public.is_entregador();
  r public.reversoes%ROWTYPE; ord public.orders%ROWTYPE; k record; prev uuid; h text; hoje date := public.data_operacional(); p text;
  ch integer := coalesce(_cheios,0); vr integer := coalesce(_vazios_recolhidos,0); vc integer := coalesce(_vazios_cliente,0);
  sb integer := coalesce(_substituto,0); emp integer; disponivel boolean; mid uuid; rmid uuid; s integer; nome text := public._meu_nome(); BEGIN
  IF NOT (ope OR ent) THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Confirmação exige chave de reenvio'; END IF;
  IF ch < 0 OR vr < 0 OR vc < 0 OR sb < 0 OR ch + vr + vc + sb = 0 THEN RAISE EXCEPTION 'Informe as quantidades conferidas'; END IF;
  IF _local IS NULL OR _local NOT IN ('portaria','carga') THEN RAISE EXCEPTION 'Informe onde o produto foi recebido: portaria ou carga'; END IF;
  IF _local = 'portaria' AND NOT ope THEN RAISE EXCEPTION 'Entregador registra só na própria carga' USING ERRCODE='42501'; END IF;
  IF (ch > 0 OR vr > 0) AND (_condicao IS NULL OR _condicao NOT IN ('intacto','problema','parcial','nao_conferido')) THEN
    RAISE EXCEPTION 'Informe a condição do item recolhido'; END IF;
  h := md5(concat_ws('|', _id::text, _local, coalesce(_carga_id::text,''), ch::text, vr::text, vc::text, sb::text, coalesce(_condicao,''), coalesce(btrim(_observacoes),'')));
  prev := public._reenvio(o, _chave, 'reversao_fisico', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  IF _local = 'carga' THEN
    SELECT * INTO k FROM public.cargas WHERE id=_carga_id AND organization_id=o FOR UPDATE;
    IF k.id IS NULL OR k.status <> 'aberta' THEN RAISE EXCEPTION 'Carga inexistente ou encerrada'; END IF;
    IF NOT ope AND k.entregador_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Entregador registra só na própria carga' USING ERRCODE='42501'; END IF;
  END IF;
  SELECT * INTO r FROM public.reversoes WHERE id=_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Reversão não encontrada'; END IF;
  IF r.status = 'solicitada' THEN RAISE EXCEPTION 'Aguardando autorização do administrador'; END IF;
  IF r.status <> 'aguardando_retorno' THEN RAISE EXCEPTION 'Nada físico pendente nesta reversão (situação: %)', r.status; END IF;
  IF ch > r.esperado_cheios - r.confirmado_cheios OR vr > r.esperado_vazios_recolher - r.confirmado_vazios_recolher
     OR vc > r.esperado_vazios_cliente - r.confirmado_vazios_cliente OR sb > r.esperado_substituto - r.confirmado_substituto THEN
    RAISE EXCEPTION 'Quantidade maior que a pendente: faltam % cheio(s), % vazio(s) a recolher, % vazio(s) ao cliente, % substituto(s)',
      r.esperado_cheios - r.confirmado_cheios, r.esperado_vazios_recolher - r.confirmado_vazios_recolher,
      r.esperado_vazios_cliente - r.confirmado_vazios_cliente, r.esperado_substituto - r.confirmado_substituto;
  END IF;
  SELECT * INTO ord FROM public.orders WHERE id=r.order_id;
  p := public._produto_chave(r.produto);
  IF p IS NULL THEN RAISE EXCEPTION 'Produto sem controle de estoque: %', r.produto; END IF;
  IF _local = 'portaria' THEN
    PERFORM public._travar_portaria(o, p, hoje);
    IF NOT EXISTS (SELECT 1 FROM public.movimentacoes_portaria WHERE organization_id=o AND data_operacao=hoje AND tipo='abertura') THEN
      RAISE EXCEPTION 'A abertura da portaria de % ainda não foi registrada. Confirme a abertura do dia antes', to_char(hoje,'DD/MM/YYYY'); END IF;
  END IF;
  emp := least(ch, r.esperado_emprestados - r.confirmado_emprestados);
  disponivel := _condicao = 'intacto' AND r.tipo <> 'troca';
  PERFORM set_config('g1.acao_controlada','on',true);
  -- entrada: o que voltou
  IF ch > 0 OR vr > 0 THEN
    IF disponivel THEN
      IF _local = 'portaria' THEN
        mid := public.registrar_movimentacao_portaria('reversao', p, ch, vr, -emp, ord.client_id, ord.client_name, r.id,
          'Devolução recebida (reversão ' || left(r.id::text,8) || ')', hoje);
      ELSE
        INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados, order_id, registrado_por)
          VALUES (o, k.id, 'reversao', p, ch, vr, -emp, r.order_id, auth.uid()) RETURNING id INTO mid;
      END IF;
    ELSE
      INSERT INTO public.itens_conferencia(organization_id, reversao_id, local, carga_id, produto, cheios, vazios, condicao, registrado_por)
        VALUES (o, r.id, _local, CASE WHEN _local='carga' THEN k.id END, p, ch, vr,
          CASE WHEN r.tipo='troca' AND _condicao='intacto' THEN 'problema' ELSE _condicao END, auth.uid()) RETURNING id INTO mid;
      IF emp > 0 THEN  -- o casco emprestado voltou com o cheio, mesmo que o conteúdo vá para conferência
        IF _local = 'portaria' THEN
          PERFORM public.registrar_movimentacao_portaria('reversao', p, 0, 0, -emp, ord.client_id, ord.client_name, r.id, 'Casco emprestado devolvido (reversão)', hoje);
        ELSE
          INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados, order_id, registrado_por)
            VALUES (o, k.id, 'reversao', p, 0, 0, -emp, r.order_id, auth.uid());
        END IF;
      END IF;
    END IF;
    INSERT INTO public.reversao_movimentos(organization_id, reversao_id, tipo, local, carga_id, produto, cheios, vazios, emprestados, condicao,
        observacoes, movimento_id, registrado_por, registrado_por_nome, data_operacao)
      VALUES (o, r.id, 'recolhimento', _local, CASE WHEN _local='carga' THEN k.id END, p, ch, vr, emp, _condicao, _observacoes, mid, auth.uid(), nome, hoje)
      RETURNING id INTO rmid;
  END IF;
  -- saída: substituto da troca e vazio devolvido ao cliente, do local real
  IF sb > 0 OR vc > 0 THEN
    IF _local = 'portaria' THEN
      s := public._saldo_portaria_cheios(o, p, hoje);
      IF s < sb THEN RAISE EXCEPTION 'Saldo insuficiente na portaria para %: disponível %, necessário %', p, greatest(s,0), sb; END IF;
      SELECT coalesce(sum(delta_vazios),0) INTO s FROM public.movimentacoes_portaria
       WHERE organization_id=o AND produto=p AND data_operacao=hoje AND tipo NOT IN ('entrada_patio','ajuste_patio');
      IF s < vc THEN RAISE EXCEPTION 'Vazios insuficientes na portaria para %: há %', p, greatest(s,0); END IF;
      mid := public.registrar_movimentacao_portaria('reversao', p, -sb, -vc, 0, ord.client_id, ord.client_name, r.id,
        CASE WHEN sb > 0 THEN 'Substituto entregue (troca ' ELSE 'Vazio devolvido ao cliente (reversão ' END || left(r.id::text,8) || ')', hoje);
    ELSE
      s := public._saldo_carga(k.id, p);
      IF s < sb THEN RAISE EXCEPTION 'Carga insuficiente para %: há %, necessário %', p, greatest(s,0), sb; END IF;
      SELECT coalesce(sum(delta_vazios),0) INTO s FROM public.carga_movimentos WHERE carga_id=k.id AND produto=p;
      IF s < vc THEN RAISE EXCEPTION 'Vazios insuficientes na carga para %: há %', p, greatest(s,0); END IF;
      INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, order_id, registrado_por)
        VALUES (o, k.id, 'reversao', p, -sb, -vc, r.order_id, auth.uid()) RETURNING id INTO mid;
    END IF;
    INSERT INTO public.reversao_movimentos(organization_id, reversao_id, tipo, local, carga_id, produto, substituto, vazios_cliente,
        observacoes, movimento_id, registrado_por, registrado_por_nome, data_operacao)
      VALUES (o, r.id, 'saida', _local, CASE WHEN _local='carga' THEN k.id END, p, sb, vc, _observacoes, mid, auth.uid(), nome, hoje)
      RETURNING id INTO mid;
    rmid := coalesce(rmid, mid);
  END IF;
  UPDATE public.reversoes SET confirmado_cheios=confirmado_cheios+ch, confirmado_vazios_recolher=confirmado_vazios_recolher+vr,
    confirmado_vazios_cliente=confirmado_vazios_cliente+vc, confirmado_substituto=confirmado_substituto+sb,
    confirmado_emprestados=confirmado_emprestados+emp WHERE id=r.id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reversao_atualizar(r.id);
  PERFORM public._reenvio_fim(o, _chave, rmid);
  RETURN rmid; END $$;

-- Reembolso realizado: só depois de confirmado. Dinheiro: de onde saiu. PIX/cartão: conta da empresa + referência.
CREATE OR REPLACE FUNCTION public.reembolso_registrar(_id uuid, _origem text, _referencia text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); e public.reembolsos%ROWTYPE; rc public.recebimentos%ROWTYPE; rv public.reversoes%ROWTYPE;
  prev uuid; dest text; resp uuid; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Reembolso exige chave de reenvio'; END IF;
  prev := public._reenvio(o, _chave, 'reembolso_registrar', md5(concat_ws('|', _id::text, coalesce(_origem,''), coalesce(btrim(_referencia),''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO e FROM public.reembolsos WHERE id=_id AND organization_id=o;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Reembolso não encontrado'; END IF;
  SELECT * INTO rc FROM public.recebimentos WHERE id=e.recebimento_id;
  dest := public._destino_efetivo(rc.destino, rc.forma, rc.origem);
  IF rc.forma = 'dinheiro' THEN
    IF _origem IS NULL OR _origem NOT IN ('caixa','entregador','cobrador') THEN
      RAISE EXCEPTION 'Informe de onde saiu o dinheiro: caixa, entregador ou cobrador'; END IF;
    IF _origem = 'entregador' THEN
      IF dest <> 'entregador' THEN RAISE EXCEPTION 'Este dinheiro não ficou com entregador'; END IF;
      resp := coalesce(rc.responsavel_id, rc.recebido_por);
      PERFORM pg_advisory_xact_lock(hashtextextended('g1.acerto|' || o || '|' || resp, 0));  -- mesma trava do acerto
    ELSIF _origem = 'cobrador' THEN
      IF dest <> 'cobrador' THEN RAISE EXCEPTION 'Este dinheiro não ficou com cobrador'; END IF;
      resp := rc.cobrador_id;
    END IF;
  ELSE
    IF coalesce(_origem,'conta_empresa') <> 'conta_empresa' THEN RAISE EXCEPTION 'PIX e cartão: o reembolso sai da conta da empresa'; END IF;
    IF coalesce(length(btrim(_referencia)),0) < 4 THEN
      RAISE EXCEPTION 'Informe a referência ou comprovante do reembolso (PIX/cartão só conta como devolvido depois de confirmado)'; END IF;
  END IF;
  SELECT * INTO e FROM public.reembolsos WHERE id=_id FOR UPDATE;
  SELECT * INTO rv FROM public.reversoes WHERE id=e.reversao_id FOR UPDATE;
  IF e.status <> 'pendente' THEN RAISE EXCEPTION 'Reembolso já registrado'; END IF;
  SELECT * INTO rc FROM public.recebimentos WHERE id=e.recebimento_id FOR UPDATE;
  IF _origem IN ('entregador','cobrador') AND rc.acerto_id IS NOT NULL THEN
    RAISE EXCEPTION 'Este dinheiro já foi entregue no acerto: o reembolso sai do caixa (o acerto original fica preservado)'; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.reembolsos SET status='realizado', origem=CASE WHEN rc.forma='dinheiro' THEN _origem ELSE 'conta_empresa' END,
    responsavel_id=resp, referencia=nullif(btrim(coalesce(_referencia,'')),''), realizado_por=auth.uid(), realizado_por_nome=public._meu_nome(),
    realizado_em=now(), data_operacao=public.data_operacional() WHERE id=_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reversao_atualizar(e.reversao_id);
  PERFORM public._reenvio_fim(o, _chave, _id);
  RETURN _id; END $$;

-- Item recolhido com problema ou sem condição confirmada: só entra no estoque disponível depois da conferência.
CREATE OR REPLACE FUNCTION public.conferencia_resolver(_id uuid, _resultado text, _motivo text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o uuid := public._ctx_org(); it public.itens_conferencia%ROWTYPE; prev uuid; hoje date := public.data_operacional();
  c record; mid uuid; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _resultado IS NULL OR _resultado NOT IN ('liberado','baixado') THEN RAISE EXCEPTION 'Resultado inválido'; END IF;
  IF coalesce(length(btrim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Descreva a conferência (mínimo 5 letras)'; END IF;
  prev := public._reenvio(o, _chave, 'conferencia_resolver', md5(concat_ws('|', _id::text, _resultado, btrim(_motivo)))); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO it FROM public.itens_conferencia WHERE id=_id AND organization_id=o FOR UPDATE;
  IF it.id IS NULL THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF it.status <> 'em_conferencia' THEN RAISE EXCEPTION 'Item já conferido'; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  IF _resultado = 'liberado' THEN
    IF it.local = 'carga' THEN SELECT * INTO c FROM public.cargas WHERE id=it.carga_id FOR UPDATE; END IF;
    IF it.local = 'carga' AND c.status = 'aberta' THEN
      INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, delta_vazios, registrado_por)
        VALUES (o, it.carga_id, 'reversao', it.produto, it.cheios, it.vazios, auth.uid()) RETURNING id INTO mid;
    ELSE
      PERFORM public._travar_portaria(o, it.produto, hoje);
      IF NOT EXISTS (SELECT 1 FROM public.movimentacoes_portaria WHERE organization_id=o AND data_operacao=hoje AND tipo='abertura') THEN
        RAISE EXCEPTION 'A abertura da portaria de % ainda não foi registrada. Confirme a abertura do dia antes', to_char(hoje,'DD/MM/YYYY'); END IF;
      mid := public.registrar_movimentacao_portaria('reversao', it.produto, it.cheios, it.vazios, 0, NULL, NULL, it.reversao_id,
        'Liberado após conferência: ' || btrim(_motivo), hoje);
    END IF;
    INSERT INTO public.reversao_movimentos(organization_id, reversao_id, tipo, local, carga_id, produto, cheios, vazios, condicao, observacoes,
        movimento_id, registrado_por, registrado_por_nome, data_operacao)
      VALUES (o, it.reversao_id, 'liberacao_conferencia', CASE WHEN it.local='carga' AND c.status='aberta' THEN 'carga' ELSE 'portaria' END,
        CASE WHEN it.local='carga' AND c.status='aberta' THEN it.carga_id END, it.produto, it.cheios, it.vazios, 'conferido', btrim(_motivo),
        mid, auth.uid(), public._meu_nome(), hoje);
  END IF;
  UPDATE public.itens_conferencia SET status=_resultado, motivo_resolucao=btrim(_motivo), resolvido_por=auth.uid(), resolvido_em=now() WHERE id=_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, _id);
  RETURN _id; END $$;

-- ───────────── 5. Acerto do entregador: desconta reembolso devolvido por ele; ignora recebimento anulado ─────────────
CREATE OR REPLACE FUNCTION public.registrar_acerto(_entregador_id uuid, _dinheiro_entregue numeric, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; h text; aid uuid; esperado numeric; n integer; nome text; dif numeric;
  pix numeric; cartao numeric; qe integer; qr integer; ids uuid[]; rids uuid[]; reemb numeric; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Acerto exige chave de reenvio'; END IF;
  IF _dinheiro_entregue IS NULL OR _dinheiro_entregue < 0 THEN RAISE EXCEPTION 'Informe o dinheiro entregue (zero ou mais)'; END IF;
  SELECT p.name INTO nome FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
   WHERE p.id=_entregador_id AND p.organization_id=o;
  IF nome IS NULL THEN RAISE EXCEPTION 'Entregador inválido ou de outra empresa'; END IF;
  h := md5(concat_ws('|', _entregador_id::text, round(_dinheiro_entregue,2)::text, coalesce(btrim(_motivo),'')));
  prev := public._reenvio(o, _chave, 'registrar_acerto', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('g1.acerto|' || o || '|' || _entregador_id, 0));
  PERFORM 1 FROM public.recebimentos r
   WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.anulado_em IS NULL AND r.forma='dinheiro'
     AND public._destino_efetivo(r.destino, r.forma, r.origem)='entregador'
     AND coalesce(r.responsavel_id, r.recebido_por)=_entregador_id
   FOR UPDATE;
  SELECT coalesce(array_agg(r.id), '{}'), coalesce(sum(r.valor),0), count(*) INTO ids, esperado, n
    FROM public.recebimentos r
   WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.anulado_em IS NULL AND r.forma='dinheiro'
     AND public._destino_efetivo(r.destino, r.forma, r.origem)='entregador'
     AND coalesce(r.responsavel_id, r.recebido_por)=_entregador_id;
  SELECT coalesce(array_agg(e.id), '{}'), coalesce(sum(e.valor),0) INTO rids, reemb
    FROM public.reembolsos e
   WHERE e.organization_id=o AND e.status='realizado' AND e.origem='entregador' AND e.responsavel_id=_entregador_id AND e.acerto_id IS NULL;
  esperado := esperado - reemb;
  IF n = 0 AND _dinheiro_entregue = 0 THEN RAISE EXCEPTION 'Nada a acertar: não há dinheiro pendente com este entregador'; END IF;
  dif := round(_dinheiro_entregue - esperado, 2);
  IF dif <> 0 AND coalesce(length(btrim(_motivo)),0) < 5 THEN
    RAISE EXCEPTION 'Valor entregue (%) diferente do esperado (%): informe o motivo', _dinheiro_entregue, esperado; END IF;
  SELECT coalesce(sum(r.valor) FILTER (WHERE r.forma='pix'),0), coalesce(sum(r.valor) FILTER (WHERE r.forma='cartao'),0)
    INTO pix, cartao
    FROM public.recebimentos r JOIN public.orders ord ON ord.id=r.order_id
   WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.anulado_em IS NULL AND r.forma<>'dinheiro' AND r.origem IN ('entrega','venda_rua')
     AND ord.delivery_person_id=_entregador_id;
  SELECT count(DISTINCT r.order_id) FILTER (WHERE r.origem='entrega'), count(DISTINCT r.order_id) FILTER (WHERE r.origem='venda_rua')
    INTO qe, qr FROM public.recebimentos r WHERE r.id = ANY(ids);
  INSERT INTO public.acertos_entregador(organization_id, entregador_id, entregador_nome, data, total_dinheiro, total_pix, total_cartao, total_geral,
      qtd_entregas, qtd_vendas_rua, conferido_por, conferido_em, status, observacoes,
      dinheiro_esperado, dinheiro_entregue, diferenca, motivo_divergencia, qtd_recebimentos, registrado_por)
    VALUES (o, _entregador_id, nome, public.data_operacional(), esperado, pix, cartao, esperado + pix + cartao,
      coalesce(qe,0), coalesce(qr,0), auth.uid(), now(), CASE WHEN dif = 0 THEN 'conferido' ELSE 'divergente' END,
      concat_ws(' | ', 'PIX e cartão: informativos (destino pendente da decisão 7)',
        CASE WHEN reemb > 0 THEN format('Reembolsos pagos pelo entregador a clientes: R$ %s (descontados)', reemb) END),
      esperado, round(_dinheiro_entregue,2), dif, CASE WHEN dif <> 0 THEN btrim(_motivo) END, n, auth.uid())
    RETURNING id INTO aid;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.recebimentos SET acerto_id = aid WHERE id = ANY(ids);
  UPDATE public.reembolsos SET acerto_id = aid WHERE id = ANY(rids);
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM public._reenvio_fim(o, _chave, aid);
  RETURN aid; END $$;

CREATE OR REPLACE FUNCTION public.acerto_previa(_entregador_id uuid)
RETURNS TABLE(categoria text, forma text, qtd integer, total numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_entregador_id AND organization_id=o) THEN
    RAISE EXCEPTION 'Entregador de outra empresa' USING ERRCODE='42501'; END IF;
  RETURN QUERY
    WITH rec AS (
      SELECT r.valor FROM public.recebimentos r
       WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.anulado_em IS NULL AND r.forma='dinheiro'
         AND public._destino_efetivo(r.destino, r.forma, r.origem)='entregador'
         AND coalesce(r.responsavel_id, r.recebido_por)=_entregador_id),
    reb AS (
      SELECT e.valor FROM public.reembolsos e
       WHERE e.organization_id=o AND e.status='realizado' AND e.origem='entregador' AND e.responsavel_id=_entregador_id AND e.acerto_id IS NULL)
    SELECT 'entregar'::text, 'dinheiro'::text, (SELECT count(*) FROM rec)::int,
           (SELECT coalesce(sum(valor),0) FROM rec) - (SELECT coalesce(sum(valor),0) FROM reb)
     WHERE EXISTS (SELECT 1 FROM rec)
    UNION ALL
    SELECT 'reembolso'::text, 'dinheiro'::text, count(*)::int, coalesce(sum(valor),0) FROM reb HAVING count(*) > 0
    UNION ALL
    SELECT 'informativo'::text, r.forma, count(*)::int, coalesce(sum(r.valor),0)
      FROM public.recebimentos r JOIN public.orders ord ON ord.id=r.order_id
     WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.anulado_em IS NULL AND r.forma<>'dinheiro'
       AND r.origem IN ('entrega','venda_rua') AND ord.delivery_person_id=_entregador_id
     GROUP BY r.forma;
END $$;

CREATE OR REPLACE FUNCTION public.dinheiro_aguardando_acerto()
RETURNS TABLE(destino text, responsavel_id uuid, responsavel_nome text, qtd integer, total numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY
    SELECT d.dest, d.resp, coalesce(pr.name, c.nome, '—'), (count(*) FILTER (WHERE d.valor > 0))::int, sum(d.valor)
      FROM (SELECT public._destino_efetivo(r.destino, r.forma, r.origem) AS dest,
                   CASE WHEN public._destino_efetivo(r.destino, r.forma, r.origem)='cobrador' THEN r.cobrador_id
                        ELSE coalesce(r.responsavel_id, r.recebido_por) END AS resp, r.valor
              FROM public.recebimentos r
             WHERE r.organization_id=o AND r.acerto_id IS NULL AND r.anulado_em IS NULL AND r.forma='dinheiro'
            UNION ALL
            SELECT e.origem, e.responsavel_id, -e.valor FROM public.reembolsos e
             WHERE e.organization_id=o AND e.status='realizado' AND e.origem IN ('entregador','cobrador') AND e.acerto_id IS NULL) d
      LEFT JOIN public.profiles pr ON pr.id = d.resp AND d.dest='entregador'
      LEFT JOIN public.colaboradores c ON c.id = d.resp AND d.dest='cobrador'
     WHERE d.dest IN ('entregador','cobrador')
     GROUP BY d.dest, d.resp, pr.name, c.nome
    HAVING sum(d.valor) <> 0
     ORDER BY 5 DESC;
END $$;

-- ───────────── 6. Caminhos antigos: estoque de reversão só pela ação; cancelamento com pagamento/carga vai pela reversão ─────────────
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
  IF NOT _ctl AND _tipo IN ('venda','venda_comodato') THEN
    RAISE EXCEPTION 'Baixa por venda só pela ação de venda (pedido e recebimento juntos)' USING ERRCODE='42501'; END IF;
  IF NOT _ctl AND _tipo IN ('reversao','correcao_duplicidade') THEN
    RAISE EXCEPTION 'Movimento de reversão só pela ação de reversão autorizada' USING ERRCODE='42501'; END IF;
  IF _tipo NOT IN ('entrada_patio','ajuste_patio') THEN PERFORM public._travar_portaria(_org, _produto, _d); END IF;
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(organization_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes, registrado_por, registrado_por_nome, data_operacao)
  VALUES (_org, _tipo, _produto, _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes, auth.uid(), _user_name, _d) RETURNING id INTO _id;
  RETURN _id;
END $function$;

CREATE OR REPLACE FUNCTION public.admin_corrigir_pedido(_order_id uuid, _novo_preco numeric, _novo_status text, _motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
    RAISE EXCEPTION 'Venda concluída não é cancelada aqui: use a reversão (devolução integral, troca por problema ou duplicidade), autorizada pelo administrador' USING ERRCODE='42501'; END IF;
  IF r.status = 'cancelled' THEN RAISE EXCEPTION 'Pedido cancelado não muda' USING ERRCODE='42501'; END IF;
  IF _novo_preco IS NOT NULL AND _novo_preco IS DISTINCT FROM r.price AND (tem_pag OR r.status IN ('completed','delivered')) THEN
    RAISE EXCEPTION 'Preço de venda com pagamento ou baixa registrados não muda (a diferença de preço fica fora da reversão desta etapa)' USING ERRCODE='42501'; END IF;
  IF _novo_status = 'cancelled' AND (tem_pag OR EXISTS (SELECT 1 FROM public.carga_movimentos WHERE order_id=r.id)) THEN
    RAISE EXCEPTION 'Pedido com pagamento ou produto na carga: cancele pela reversão (o produto fica na carga e o pagamento vira reembolso pendente)' USING ERRCODE='42501'; END IF;
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

-- Recebimento de promissória cancelada pela reversão já é recusado ("Promissória já encerrada").

-- ───────────── 7. Permissões das funções ─────────────
REVOKE ALL ON FUNCTION public._meu_nome(), public._reversao_atualizar(uuid), public._reversao_vinculos(uuid,uuid),
  public._reversao_autorizar(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reversao_solicitar(uuid,text,text,uuid,boolean,boolean,text), public.reversao_autorizar(uuid,boolean,text),
  public.reversao_recusar(uuid,text,text), public.reversao_confirmar_fisico(uuid,text,uuid,integer,integer,integer,integer,text,text,text),
  public.reembolso_registrar(uuid,text,text,text), public.conferencia_resolver(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reversao_solicitar(uuid,text,text,uuid,boolean,boolean,text), public.reversao_autorizar(uuid,boolean,text),
  public.reversao_recusar(uuid,text,text), public.reversao_confirmar_fisico(uuid,text,uuid,integer,integer,integer,integer,text,text,text),
  public.reembolso_registrar(uuid,text,text,text), public.conferencia_resolver(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.acerto_previa(uuid), public.registrar_acerto(uuid,numeric,text,text), public.dinheiro_aguardando_acerto() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acerto_previa(uuid), public.registrar_acerto(uuid,numeric,text,text), public.dinheiro_aguardando_acerto() TO authenticated;
REVOKE ALL ON FUNCTION public.registrar_movimentacao_portaria(text,text,integer,integer,integer,uuid,text,uuid,text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_portaria(text,text,integer,integer,integer,uuid,text,uuid,text,date) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_corrigir_pedido(uuid,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_corrigir_pedido(uuid,numeric,text,text) TO authenticated;
