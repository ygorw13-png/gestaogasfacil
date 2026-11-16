-- 015 — Correção administrativa da forma de pagamento de venda concluída.
-- Só administrador, com motivo e chave contra repetição. Não toca preço, produto, quantidade,
-- cliente, data, estoque, carga, cascos, comodato. Não cria recebimento, reembolso nem promissória.
-- Promissória indevida: só a vinculada à venda pelo order_id E criada na mesma transação da venda
-- (mesmo created_at), com o mesmo valor, totalmente em aberto e sem recebimento. Qualquer outra
-- situação bloqueia e pede conciliação. Venda, título e auditoria na mesma transação.
CREATE OR REPLACE FUNCTION public.admin_corrigir_forma_pagamento(_order_id uuid, _nova_forma text, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  o uuid := public._ctx_org(); r record; pn record; fa text; fn text; prev uuid; aid uuid;
  n_pn int; cancelar boolean := false; mot text := btrim(coalesce(_motivo,''));
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF length(mot) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)'; END IF;
  fn := public._forma_pedido(_nova_forma);
  IF fn IS NULL THEN RAISE EXCEPTION 'Forma de pagamento inválida: %', coalesce(_nova_forma,'(vazia)'); END IF;
  prev := public._reenvio(o, _chave, 'corrigir_forma', md5(concat_ws('|', _order_id::text, fn, mot)));
  IF prev IS NOT NULL THEN RETURN prev; END IF;

  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Venda não encontrada'; END IF;
  IF r.status NOT IN ('completed','delivered') THEN
    RAISE EXCEPTION 'Só venda concluída tem a forma corrigida aqui'; END IF;
  IF EXISTS (SELECT 1 FROM public.reversoes WHERE order_id=r.id AND status <> 'recusada') THEN
    RAISE EXCEPTION 'Venda com reversão registrada: a forma de pagamento não muda por esta correção' USING ERRCODE='42501'; END IF;
  fa := public._forma_pedido(r.payment_method);
  IF fa IS NULL THEN
    RAISE EXCEPTION 'Forma original (%) não reconhecida: precisa de conferência manual', coalesce(r.payment_method,'vazia') USING ERRCODE='42501'; END IF;
  IF fa = fn THEN RAISE EXCEPTION 'A venda já está registrada com essa forma de pagamento'; END IF;

  IF NOT public._forma_valor_opcional(fn) THEN
    -- Forma nova com valor obrigatório: só se o tratamento financeiro já gravado for o mesmo (ex.: crédito ↔ débito).
    IF public._forma_valor_opcional(fa) OR public._forma_chave(fa) IS DISTINCT FROM public._forma_chave(fn)
       OR coalesce(r.price,0) <= 0 THEN
      RAISE EXCEPTION 'Esta troca mudaria o recebimento ou a cobrança da venda e precisa de conciliação financeira; a correção não cria recebimento nem promissória' USING ERRCODE='42501'; END IF;
  ELSE
    -- Forma nova sem recebimento: nada financeiro pode ficar ativo.
    IF EXISTS (SELECT 1 FROM public.recebimentos WHERE order_id=r.id AND anulado_em IS NULL)
       OR EXISTS (SELECT 1 FROM public.divergencias WHERE order_id=r.id) THEN
      RAISE EXCEPTION 'Venda com recebimento registrado: precisa de conciliação (reembolso pela reversão), não desta correção' USING ERRCODE='42501'; END IF;
    SELECT count(*) INTO n_pn FROM public.promissory_notes WHERE order_id=r.id AND organization_id=o;
    IF n_pn > 1 THEN
      RAISE EXCEPTION 'Mais de uma promissória vinculada a esta venda: precisa de conciliação' USING ERRCODE='42501'; END IF;
    IF n_pn = 1 THEN
      SELECT * INTO pn FROM public.promissory_notes WHERE order_id=r.id AND organization_id=o FOR UPDATE;
      IF pn.status <> 'cancelled' THEN
        IF pn.status IN ('paid','parcial') OR coalesce(pn.paid_amount,0) <> 0 OR pn.paid_at IS NOT NULL
           OR EXISTS (SELECT 1 FROM public.recebimentos WHERE promissory_id=pn.id) THEN
          RAISE EXCEPTION 'A promissória desta venda tem pagamento ou baixa: precisa de conciliação antes de corrigir a forma' USING ERRCODE='42501'; END IF;
        IF pn.status <> 'pending' OR pn.cobrador_id IS NOT NULL OR pn.created_at IS DISTINCT FROM r.created_at
           OR pn.value IS DISTINCT FROM r.price OR public._forma_chave(fa) IS DISTINCT FROM 'promissoria' THEN
          RAISE EXCEPTION 'A promissória vinculada não comprova ter sido gerada pelo registro desta venda (ou está com cobrador): precisa de conciliação' USING ERRCODE='42501'; END IF;
        cancelar := true;
      END IF;
    ELSIF public._forma_chave(fa) = 'promissoria' AND NOT public._forma_valor_opcional(fa) AND coalesce(r.price,0) > 0 THEN
      RAISE EXCEPTION 'Venda a prazo sem promissória vinculada: confira os títulos do cliente (conciliação) antes de corrigir' USING ERRCODE='42501';
    ELSIF fa = 'convenio' AND coalesce(r.price,0) > 0 AND r.created_at < '2026-11-16 12:26:51+00' THEN
      -- antes do 014 (aplicado em 16/11/2026 12:26:51 UTC), convênio com valor gerava promissória; sem vínculo, o título pode existir solto.
      RAISE EXCEPTION 'Venda em convênio sem promissória vinculada: confira os títulos do cliente (conciliação) antes de corrigir' USING ERRCODE='42501';
    END IF;
  END IF;

  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET payment_method=fn WHERE id=r.id;
  IF cancelar THEN
    UPDATE public.promissory_notes SET status='cancelled',
      notes = concat_ws(' | ', nullif(btrim(coalesce(notes,'')),''),
        format('Cobrança cancelada: venda %s corrigida de %s para %s pelo administrador', left(r.id::text,8), fa, fn))
     WHERE id=pn.id;
  END IF;
  PERFORM set_config('g1.acao_controlada','off',true);

  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'orders', r.id,
      jsonb_build_object('payment_method', r.payment_method),
      jsonb_build_object('payment_method', fn, 'tipo', 'correcao_forma_pagamento',
                         'promissoria_cancelada', CASE WHEN cancelar THEN pn.id END),
      mot, auth.uid())
    RETURNING id INTO aid;
  IF cancelar THEN
    INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
      VALUES (o, 'promissory_notes', pn.id,
        jsonb_build_object('status', pn.status, 'value', pn.value),
        jsonb_build_object('status', 'cancelled', 'value', pn.value, 'correcao_id', aid, 'order_id', r.id),
        mot, auth.uid());
  END IF;
  PERFORM public._reenvio_fim(o, _chave, aid);
  RETURN aid;
END $$;
REVOKE ALL ON FUNCTION public.admin_corrigir_forma_pagamento(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_corrigir_forma_pagamento(uuid,text,text,text) TO authenticated, service_role;
