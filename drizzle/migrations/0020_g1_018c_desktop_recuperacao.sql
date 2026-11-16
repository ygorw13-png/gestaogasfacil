-- 018c: recuperação do journal do Aplicativo do PC — reserva não iniciada nunca é reoferecida (vira falha no prazo),
-- recibos de envios já encerrados são confirmados sem alterar, e o hash da tentativa é mantido em cancelamentos.

CREATE OR REPLACE FUNCTION public.whatsapp_config_desligou() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.provedor = 'desktop' AND OLD.envio_ativo AND NOT (NEW.provedor = 'desktop' AND NEW.envio_ativo) THEN
    UPDATE public.whatsapp_envios SET status = 'cancelado', erro = 'Envio pelo Aplicativo do PC desligado antes do envio',
      lease_ate = NULL, atualizado_em = now()
     WHERE organization_id = NEW.organization_id AND provedor = 'desktop'
       AND (status = 'aguardando' OR (status = 'enviando' AND iniciado_em IS NULL));
  END IF;
  RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.reatribuir_entrega_aviso(_order_id uuid, _novo_entregador_id uuid, _motivo text, _transferir_carga boolean, _chave text, _canal text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _novo_entregador_id IS NULL THEN RAISE EXCEPTION 'Escolha o novo entregador'; END IF;
  PERFORM public._destino_whatsapp(o, _novo_entregador_id, _canal);
  PERFORM public.reatribuir_entrega(_order_id, _novo_entregador_id, _motivo, coalesce(_transferir_carga,false), _chave);
  UPDATE public.whatsapp_envios SET status='cancelado', erro='Pedido reatribuído antes do envio',
      lease_ate = NULL, atualizado_em=now()
   WHERE organization_id=o AND order_id=_order_id AND entregador_id <> _novo_entregador_id
     AND (status IN ('aguardando','falha','incerto') OR (status = 'enviando' AND provedor = 'desktop' AND iniciado_em IS NULL));
  RETURN public._whatsapp_enfileirar(o, _order_id, _novo_entregador_id, _canal, _chave); END $$;

CREATE OR REPLACE FUNCTION public._wd_vencer(_org uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.whatsapp_envios SET status = 'incerto', resultado_origem = 'prazo', lease_ate = NULL, atualizado_em = now(),
      erro = 'O aplicativo do PC começou o envio e não informou o resultado no prazo: confira no celular do entregador'
   WHERE organization_id = _org AND provedor = 'desktop' AND status = 'enviando' AND iniciado_em IS NOT NULL AND lease_ate < now();
  UPDATE public.whatsapp_envios SET status = 'falha', resultado_origem = 'prazo', lease_ate = NULL, atualizado_em = now(),
      erro = 'O aplicativo do PC não iniciou o envio no prazo (não enviado)'
   WHERE organization_id = _org AND provedor = 'desktop' AND status = 'enviando' AND iniciado_em IS NULL AND lease_ate < now();
END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_revogar() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._wd_admin(); BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('wd:' || o));
  UPDATE public.whatsapp_desktop_dispositivos SET ativo = false, revogado_em = now(), revogado_por = auth.uid() WHERE organization_id = o AND ativo;
  UPDATE public.whatsapp_config SET envio_ativo = false, atualizado_por = auth.uid(), atualizado_em = now() WHERE organization_id = o AND envio_ativo AND provedor = 'desktop';
  UPDATE public.whatsapp_envios SET status = 'cancelado', erro = 'Aplicativo do PC revogado antes do envio', lease_ate = NULL, atualizado_em = now()
   WHERE organization_id = o AND provedor = 'desktop' AND status = 'enviando' AND iniciado_em IS NULL;
  UPDATE public.whatsapp_envios SET status = 'incerto', resultado_origem = 'revogado', lease_ate = NULL, atualizado_em = now(),
      erro = 'Aplicativo do PC revogado durante o envio: confira no celular do entregador'
   WHERE organization_id = o AND provedor = 'desktop' AND status = 'enviando' AND iniciado_em IS NOT NULL;
  RETURN public.whatsapp_desktop_status(); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_poll(_token_hash text, _telefone text, _origem text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d public.whatsapp_desktop_dispositivos; c public.whatsapp_config; e record; r record; tok text; i integer := 0; BEGIN
  SELECT * INTO d FROM public.whatsapp_desktop_dispositivos WHERE token_hash = _token_hash AND ativo;
  IF d.id IS NULL THEN RETURN public._wd_negado(_origem); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('wd:' || d.organization_id));
  PERFORM public._wd_vencer(d.organization_id);
  SELECT * INTO c FROM public.whatsapp_config WHERE organization_id = d.organization_id;
  IF NOT coalesce(public._wd_pronto(d, c, _telefone), false) THEN RETURN jsonb_build_object('job', NULL); END IF;
  -- Um envio por vez: com um reservado/iniciado em aberto, não entrega outro (nem o mesmo de novo).
  IF EXISTS (SELECT 1 FROM public.whatsapp_envios WHERE organization_id = d.organization_id AND provedor = 'desktop' AND status = 'enviando') THEN
    RETURN jsonb_build_object('job', NULL); END IF;
  LOOP
    i := i + 1; EXIT WHEN i > 20;
    SELECT * INTO e FROM public.whatsapp_envios
     WHERE organization_id = d.organization_id AND provedor = 'desktop' AND status = 'aguardando'
     ORDER BY criado_em, id LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF e.id IS NULL THEN RETURN jsonb_build_object('job', NULL); END IF;
    SELECT * INTO r FROM public.orders WHERE id = e.order_id;
    IF r.delivery_person_id IS DISTINCT FROM e.entregador_id OR r.status NOT IN ('assigned', 'delivering') THEN
      UPDATE public.whatsapp_envios SET status = 'cancelado', erro = 'Pedido não está mais com este entregador', atualizado_em = now() WHERE id = e.id;
      CONTINUE; END IF;
    tok := public._wd_segredo();
    UPDATE public.whatsapp_envios SET status = 'enviando', dispositivo_id = d.id, tentativa_hash = public._wd_hash(tok),
      lease_ate = now() + interval '60 seconds', iniciado_em = NULL, erro = NULL, atualizado_em = now() WHERE id = e.id;
    RETURN jsonb_build_object('job', jsonb_build_object('id', e.id, 'attempt_token', tok, 'to', e.telefone,
      'text', public._wd_texto(e.order_id), 'expected_phone', c.desktop_telefone));
  END LOOP;
  RETURN jsonb_build_object('job', NULL); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_begin(_token_hash text, _job uuid, _tentativa text, _telefone text, _origem text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d public.whatsapp_desktop_dispositivos; c public.whatsapp_config; e record; r record; BEGIN
  SELECT * INTO d FROM public.whatsapp_desktop_dispositivos WHERE token_hash = _token_hash AND ativo;
  IF d.id IS NULL THEN RETURN public._wd_negado(_origem); END IF;
  SELECT * INTO e FROM public.whatsapp_envios WHERE id = _job AND organization_id = d.organization_id AND provedor = 'desktop';
  IF e.id IS NULL THEN RETURN jsonb_build_object('error', 'Envio não encontrado', 'status', 404); END IF;
  SELECT * INTO r FROM public.orders WHERE id = e.order_id FOR UPDATE;
  SELECT * INTO e FROM public.whatsapp_envios WHERE id = _job FOR UPDATE;
  SELECT * INTO c FROM public.whatsapp_config WHERE organization_id = d.organization_id;
  IF e.dispositivo_id IS DISTINCT FROM d.id OR e.tentativa_hash IS DISTINCT FROM public._wd_hash(_tentativa)
     OR e.status <> 'enviando' OR e.iniciado_em IS NOT NULL OR e.lease_ate < now() THEN
    RETURN jsonb_build_object('allowed', false); END IF;
  IF r.delivery_person_id IS DISTINCT FROM e.entregador_id OR r.status NOT IN ('assigned', 'delivering') THEN
    UPDATE public.whatsapp_envios SET status = 'cancelado', erro = 'Pedido não está mais com este entregador',
      lease_ate = NULL, atualizado_em = now() WHERE id = e.id;
    RETURN jsonb_build_object('allowed', false); END IF;
  IF NOT coalesce(public._wd_pronto(d, c, _telefone), false) THEN RETURN jsonb_build_object('allowed', false); END IF;
  UPDATE public.whatsapp_envios SET iniciado_em = now(), lease_ate = now() + interval '120 seconds', tentativas = tentativas + 1, atualizado_em = now()
   WHERE id = e.id;
  RETURN jsonb_build_object('allowed', true); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_resultado(_token_hash text, _job uuid, _tentativa text, _resultado text, _message_id text, _erro text, _origem text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d record; e record; st text; BEGIN
  SELECT * INTO d FROM public.whatsapp_desktop_dispositivos WHERE token_hash = _token_hash AND ativo;
  IF d.id IS NULL THEN RETURN public._wd_negado(_origem); END IF;
  st := CASE _resultado WHEN 'sent' THEN 'enviado' WHEN 'failed' THEN 'falha' WHEN 'uncertain' THEN 'incerto' END;
  IF st IS NULL THEN RETURN jsonb_build_object('error', 'Resultado inválido', 'status', 400); END IF;
  SELECT * INTO e FROM public.whatsapp_envios WHERE id = _job AND organization_id = d.organization_id AND provedor = 'desktop' FOR UPDATE;
  IF e.id IS NULL THEN RETURN jsonb_build_object('error', 'Envio não encontrado', 'status', 404); END IF;
  IF e.dispositivo_id IS DISTINCT FROM d.id OR e.tentativa_hash IS DISTINCT FROM public._wd_hash(_tentativa) THEN
    RETURN jsonb_build_object('error', 'Tentativa não corresponde a este dispositivo', 'status', 409); END IF;
  IF e.resultado_origem = 'dispositivo' THEN
    IF e.status = st THEN RETURN jsonb_build_object('ok', true); END IF;
    RETURN jsonb_build_object('error', 'Resultado já registrado com outro valor', 'status', 409); END IF;
  -- Recibo de um envio que nunca foi autorizado (begin) e já está encerrado: confirma sem alterar, para o app encerrar o journal.
  IF e.iniciado_em IS NULL AND e.status IN ('falha', 'cancelado') AND st <> 'enviado' THEN
    RETURN jsonb_build_object('ok', true); END IF;
  IF e.iniciado_em IS NULL AND st <> 'falha' THEN
    RETURN jsonb_build_object('error', 'Envio não foi iniciado (begin)', 'status', 409); END IF;
  IF e.status NOT IN ('enviando', 'incerto') THEN
    RETURN jsonb_build_object('error', 'Envio não está em andamento', 'status', 409); END IF;
  UPDATE public.whatsapp_envios SET status = st, resultado_origem = 'dispositivo', lease_ate = NULL, atualizado_em = now(),
    provider_message_id = CASE WHEN st = 'enviado' THEN left(_message_id, 200) ELSE provider_message_id END,
    enviado_em = CASE WHEN st = 'enviado' THEN now() ELSE enviado_em END,
    erro = CASE st WHEN 'enviado' THEN NULL
      WHEN 'falha' THEN 'Aplicativo do PC: não enviado' || coalesce(' (' || left(_erro, 80) || ')', '')
      ELSE 'Aplicativo do PC: resultado incerto' || coalesce(' (' || left(_erro, 80) || ')', '') || ' — confira no celular do entregador' END
   WHERE id = e.id;
  RETURN jsonb_build_object('ok', true); END $$;