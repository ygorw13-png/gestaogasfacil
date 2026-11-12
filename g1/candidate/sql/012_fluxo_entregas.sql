-- G1 012 CANDIDATO — Fluxo de entregas (pedido do proprietário, 11/11/2026).
-- Aplicar depois de 001..011. Aditivo: uma coluna anulável, uma tabela de histórico, funções e gatilhos.
-- Não altera nem apaga pedidos existentes; registros antigos só mudam por regularização administrativa com motivo.
--
-- Modalidade: reutiliza orders.origem_venda ('pedido'/'online' = entrega; 'portaria'/'rua' = balcão, retirada
-- ou venda na rua). Nada é reclassificado por nome, endereço ou ausência de entregador.

-- ───────────── 1. Data prevista e classificadores ─────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS entrega_prevista date;
COMMENT ON COLUMN public.orders.entrega_prevista IS
  'Data prevista da entrega (America/Bahia). NULL = dia operacional da criação do pedido.';

CREATE OR REPLACE FUNCTION public._eh_entrega(_origem text) RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$ SELECT coalesce(_origem,'') IN ('pedido','online') $$;

CREATE OR REPLACE FUNCTION public._entrega_aberta(_status text) RETURNS boolean LANGUAGE sql IMMUTABLE
AS $$ SELECT coalesce(_status,'pending') NOT IN ('completed','delivered','cancelled') $$;

CREATE OR REPLACE FUNCTION public._entrega_data(_prevista date, _criado timestamptz) RETURNS date LANGUAGE sql STABLE
AS $$ SELECT coalesce(_prevista, (_criado AT TIME ZONE 'America/Bahia')::date) $$;

-- Motivo de "Revisão necessária" para uma entrega aberta (NULL = vínculos suficientes).
CREATE OR REPLACE FUNCTION public.entrega_motivo_revisao(_status text, _dp_id uuid, _dp text, _aceite timestamptz)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN coalesce(_status,'') NOT IN ('pending','assigned','delivering') THEN 'Situação antiga não reconhecida (' || coalesce(_status,'vazia') || ')'
    WHEN _dp_id IS NULL AND nullif(trim(coalesce(_dp,'')),'') IS NOT NULL THEN 'Entregador registrado sem conta identificada no aplicativo'
    WHEN _status IN ('assigned','delivering') AND _dp_id IS NULL THEN 'Em andamento sem entregador identificado'
    WHEN _status = 'delivering' AND _aceite IS NULL THEN 'Em rota sem aceite registrado pelo entregador'
  END $$;

-- ───────────── 2. Histórico de atribuição, aceite, recusa e conclusão ─────────────
CREATE TABLE IF NOT EXISTS public.entrega_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  tipo text NOT NULL CHECK (tipo IN ('atribuicao','reatribuicao','retirada_fila','recusa','aceite','conclusao',
                                     'cancelamento','status','regularizacao','transferencia_carga')),
  status_anterior text,
  status_novo text,
  entregador_anterior uuid,
  entregador_anterior_texto text,
  entregador_novo uuid,
  motivo text,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  registrado_por uuid,
  registrado_por_nome text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entrega_eventos_order_idx ON public.entrega_eventos(order_id, criado_em);
GRANT SELECT ON public.entrega_eventos TO authenticated;
GRANT ALL ON public.entrega_eventos TO service_role;
ALTER TABLE public.entrega_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "g1 operador le eventos de entrega" ON public.entrega_eventos;
CREATE POLICY "g1 operador le eventos de entrega" ON public.entrega_eventos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());

CREATE OR REPLACE FUNCTION public._entrega_log() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE t text; mot text := nullif(current_setting('g1.entrega_motivo', true), ''); BEGIN
  IF NOT public._eh_entrega(NEW.origem_venda) THEN RETURN NEW; END IF;
  IF NEW.delivery_person_id IS DISTINCT FROM OLD.delivery_person_id
     OR coalesce(NEW.delivery_person,'') IS DISTINCT FROM coalesce(OLD.delivery_person,'') THEN
    t := CASE
      WHEN NEW.delivery_person_id IS NULL AND NEW.rejection_reason IS NOT NULL
           AND NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN 'recusa'
      WHEN mot LIKE 'Regularização%' THEN 'regularizacao'
      WHEN NEW.delivery_person_id IS NULL THEN 'retirada_fila'
      WHEN OLD.delivery_person_id IS NULL AND nullif(trim(coalesce(OLD.delivery_person,'')),'') IS NULL THEN 'atribuicao'
      ELSE 'reatribuicao' END;
    IF t = 'recusa' THEN mot := NEW.rejection_reason; END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    t := CASE WHEN NEW.status = 'delivering' THEN 'aceite'
              WHEN NEW.status IN ('completed','delivered') THEN 'conclusao'
              WHEN NEW.status = 'cancelled' THEN 'cancelamento'
              WHEN mot LIKE 'Regularização%' THEN 'regularizacao'
              ELSE 'status' END;
  ELSE RETURN NEW; END IF;
  INSERT INTO public.entrega_eventos(organization_id, order_id, tipo, status_anterior, status_novo, entregador_anterior,
      entregador_anterior_texto, entregador_novo, motivo, registrado_por, registrado_por_nome)
    VALUES (NEW.organization_id, NEW.id, t, OLD.status, NEW.status, OLD.delivery_person_id,
      CASE WHEN OLD.delivery_person_id IS NULL THEN nullif(trim(coalesce(OLD.delivery_person,'')),'') END,
      NEW.delivery_person_id, mot, auth.uid(), public._meu_nome());
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS orders_zz_entrega_log ON public.orders;
CREATE TRIGGER orders_zz_entrega_log AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public._entrega_log();

-- ───────────── 3. Fechamento total x entregas abertas (mesma trava para os dois lados) ─────────────
CREATE OR REPLACE FUNCTION public._travar_fechamento(_org uuid) RETURNS void LANGUAGE sql
AS $$ SELECT pg_advisory_xact_lock(hashtextextended('g1.fechamento|' || _org, 0)) $$;

-- Entregas realmente abertas com previsão para o dia do fechamento ou o dia anterior.
CREATE OR REPLACE FUNCTION public._entregas_pendentes_fechamento(_org uuid, _data date)
RETURNS TABLE(id uuid, client_name text, status text, data_prevista date, delivery_person_id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.id, o.client_name, o.status, public._entrega_data(o.entrega_prevista, o.created_at), o.delivery_person_id, o.created_at
    FROM public.orders o
   WHERE o.organization_id = _org AND public._eh_entrega(o.origem_venda) AND public._entrega_aberta(o.status)
     AND public._entrega_data(o.entrega_prevista, o.created_at) BETWEEN _data - 1 AND _data
   ORDER BY 4, o.created_at $$;

CREATE OR REPLACE FUNCTION public.entregas_bloqueando_fechamento(_data date)
RETURNS TABLE(id uuid, client_name text, status text, data_prevista date, entregador_nome text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _data IS NULL THEN RAISE EXCEPTION 'Informe a data do fechamento'; END IF;
  RETURN QUERY SELECT p.id, p.client_name, p.status, p.data_prevista, pr.name, p.created_at
    FROM public._entregas_pendentes_fechamento(o, _data) p LEFT JOIN public.profiles pr ON pr.id = p.delivery_person_id;
END $$;

-- Gatilho comum: fechamento total (fechamentos_caixa) e marca de fechamento da portaria (movimentacoes_portaria).
CREATE OR REPLACE FUNCTION public._fechamento_guard_entregas() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE n integer; d date; org uuid; BEGIN
  IF TG_TABLE_NAME = 'fechamentos_caixa' THEN
    IF NEW.tipo IS DISTINCT FROM 'total' THEN RETURN NEW; END IF;   -- parcial = conferência, não encerra o dia
    d := NEW.data_fechamento;
  ELSE
    IF NEW.tipo IS DISTINCT FROM 'fechamento' THEN RETURN NEW; END IF;
    d := NEW.data_operacao;
  END IF;
  org := coalesce(NEW.organization_id, public.get_my_org());
  IF org IS NULL OR d IS NULL THEN RAISE EXCEPTION 'Fechamento sem empresa ou data' USING ERRCODE='42501'; END IF;
  PERFORM public._travar_fechamento(org);
  SELECT count(*) INTO n FROM public._entregas_pendentes_fechamento(org, d);
  IF n > 0 THEN
    RAISE EXCEPTION 'Fechamento total bloqueado: % entrega(s) em aberto com previsão para % ou o dia anterior. Conclua, reatribua ou cancele em Pedidos antes de fechar',
      n, to_char(d, 'DD/MM/YYYY') USING ERRCODE='P0001', HINT='entregas_pendentes';
  END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS zz_fechamento_guard_entregas ON public.fechamentos_caixa;
CREATE TRIGGER zz_fechamento_guard_entregas BEFORE INSERT ON public.fechamentos_caixa
  FOR EACH ROW EXECUTE FUNCTION public._fechamento_guard_entregas();
DROP TRIGGER IF EXISTS zz_fechamento_guard_entregas ON public.movimentacoes_portaria;
CREATE TRIGGER zz_fechamento_guard_entregas BEFORE INSERT ON public.movimentacoes_portaria
  FOR EACH ROW EXECUTE FUNCTION public._fechamento_guard_entregas();

-- Pedidos: aceite só pelo entregador; entrega nova/reaberta/reagendada não entra em dia já fechado.
CREATE OR REPLACE FUNCTION public._entrega_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE d date; org uuid; mexe boolean; BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'delivering' AND OLD.status IS DISTINCT FROM 'delivering' AND NOT public._g1_ctl() THEN
    RAISE EXCEPTION 'Aceite só pelo próprio entregador, no aplicativo dele' USING ERRCODE='42501'; END IF;
  IF NOT public._eh_entrega(NEW.origem_venda) OR NOT public._entrega_aberta(NEW.status) THEN RETURN NEW; END IF;
  mexe := TG_OP = 'INSERT' OR NOT public._entrega_aberta(OLD.status) OR NOT public._eh_entrega(OLD.origem_venda)
          OR NEW.entrega_prevista IS DISTINCT FROM OLD.entrega_prevista;
  IF NOT mexe THEN RETURN NEW; END IF;
  IF NEW.entrega_prevista IS NOT NULL AND NEW.entrega_prevista < public.data_operacional()
     AND (TG_OP = 'INSERT' OR NEW.entrega_prevista IS DISTINCT FROM OLD.entrega_prevista) THEN
    RAISE EXCEPTION 'A data prevista da entrega não pode ficar no passado'; END IF;
  org := coalesce(NEW.organization_id, public.get_my_org());
  d := public._entrega_data(NEW.entrega_prevista, coalesce(NEW.created_at, now()));
  PERFORM public._travar_fechamento(org);
  IF EXISTS (SELECT 1 FROM public.fechamentos_caixa f WHERE f.organization_id = org AND f.tipo = 'total'
              AND f.data_fechamento IN (d, d + 1)) THEN
    RAISE EXCEPTION 'O caixa que cobre % já teve fechamento total. Informe outra data prevista para a entrega',
      to_char(d, 'DD/MM/YYYY') USING ERRCODE='P0001'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS orders_zz_entrega_guard ON public.orders;
CREATE TRIGGER orders_zz_entrega_guard BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._entrega_guard();

-- ───────────── 4. Entregadores pela fonte canônica de papéis ─────────────
CREATE OR REPLACE FUNCTION public.listar_entregadores() RETURNS TABLE(id uuid, nome text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.id, p.name FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'entregador'
   WHERE p.organization_id = o AND p.ativo ORDER BY p.name;
END $$;

-- ───────────── 5. Reatribuição: motivo, novo aceite, sem teletransporte de estoque ─────────────
ALTER TABLE public.carga_movimentos DROP CONSTRAINT IF EXISTS carga_movimentos_tipo_check;
ALTER TABLE public.carga_movimentos ADD CONSTRAINT carga_movimentos_tipo_check CHECK (tipo = ANY (ARRAY[
  'saida_portaria','consumo_entrega','consumo_venda_rua','devolucao','reversao','correcao_duplicidade','transferencia_carga']));

CREATE OR REPLACE FUNCTION public.reatribuir_entrega(_order_id uuid, _novo_entregador_id uuid, _motivo text,
  _transferir_carga boolean, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid := public._ctx_org(); r record; aid uuid; prev uuid; k text; qtd integer; ca uuid; cb uuid;
  tr boolean := coalesce(_transferir_carga, false); h text; s integer; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF coalesce(length(trim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Reatribuição exige chave de reenvio'; END IF;
  IF _novo_entregador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
    WHERE p.id=_novo_entregador_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  h := md5(concat_ws('|', _order_id::text, coalesce(_novo_entregador_id::text,'-'), tr::text, trim(_motivo)));
  prev := public._reenvio(o, _chave, 'reatribuir_entrega', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF r.status NOT IN ('assigned','delivering') THEN RAISE EXCEPTION 'Só pedidos em aberto e atribuídos podem ser reatribuídos (status: %)', r.status; END IF;
  IF r.delivery_person_id IS NULL THEN
    RAISE EXCEPTION 'Registro sem entregador identificado: precisa de regularização administrativa'; END IF;
  IF r.delivery_person_id IS NOT DISTINCT FROM _novo_entregador_id THEN RAISE EXCEPTION 'Pedido já está com esse entregador'; END IF;
  IF tr THEN
    IF _novo_entregador_id IS NULL THEN RAISE EXCEPTION 'Transferência entre cargas exige o novo entregador'; END IF;
    k := public._produto_chave(r.product); qtd := coalesce(r.quantity, 1);
    IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de carga: %', r.product; END IF;
    INSERT INTO public.cargas(organization_id, entregador_id, criado_por) VALUES (o, _novo_entregador_id, auth.uid())
      ON CONFLICT (organization_id, entregador_id) WHERE status='aberta' DO NOTHING;
    PERFORM 1 FROM public.cargas WHERE organization_id=o AND status='aberta'
      AND entregador_id IN (r.delivery_person_id, _novo_entregador_id) ORDER BY id FOR UPDATE;
    SELECT id INTO ca FROM public.cargas WHERE organization_id=o AND entregador_id=r.delivery_person_id AND status='aberta';
    SELECT id INTO cb FROM public.cargas WHERE organization_id=o AND entregador_id=_novo_entregador_id AND status='aberta';
    IF ca IS NULL THEN RAISE EXCEPTION 'O entregador anterior não tem carga aberta: nada a transferir'; END IF;
    s := public._saldo_carga(ca, k);
    IF s < qtd THEN RAISE EXCEPTION 'A carga do entregador anterior tem % cheio(s) de %; o pedido precisa de %', greatest(s,0), k, qtd; END IF;
    INSERT INTO public.carga_movimentos(organization_id, carga_id, tipo, produto, delta_cheios, order_id, registrado_por)
      VALUES (o, ca, 'transferencia_carga', k, -qtd, r.id, auth.uid()), (o, cb, 'transferencia_carga', k, qtd, r.id, auth.uid());
  END IF;
  PERFORM set_config('g1.entrega_motivo', 'Reatribuição: ' || trim(_motivo), true);
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET
    status = CASE WHEN _novo_entregador_id IS NULL THEN 'pending' ELSE 'assigned' END,
    delivery_person = _novo_entregador_id::text, delivery_person_id = _novo_entregador_id,
    assigned_at = CASE WHEN _novo_entregador_id IS NULL THEN NULL ELSE now() END,
    accepted_at = NULL, rejection_reason = NULL WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM set_config('g1.entrega_motivo', '', true);
  IF tr THEN
    INSERT INTO public.entrega_eventos(organization_id, order_id, tipo, status_anterior, status_novo, entregador_anterior, entregador_novo,
        motivo, detalhes, registrado_por, registrado_por_nome)
      VALUES (o, r.id, 'transferencia_carga', r.status, 'assigned', r.delivery_person_id, _novo_entregador_id, trim(_motivo),
        jsonb_build_object('produto', k, 'cheios', qtd, 'carga_origem', ca, 'carga_destino', cb), auth.uid(), public._meu_nome());
  END IF;
  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'orders', _order_id, jsonb_build_object('status', r.status, 'delivery_person_id', r.delivery_person_id, 'accepted_at', r.accepted_at),
      jsonb_build_object('status', CASE WHEN _novo_entregador_id IS NULL THEN 'pending' ELSE 'assigned' END,
        'delivery_person_id', _novo_entregador_id, 'transferencia_carga', tr),
      'Reatribuição: ' || trim(_motivo), auth.uid()) RETURNING id INTO aid;
  PERFORM public._reenvio_fim(o, _chave, aid);
  RETURN aid; END $$;

-- Assinatura antiga (3 argumentos): mesma regra, sem transferência de carga.
CREATE OR REPLACE FUNCTION public.reatribuir_entrega(_order_id uuid, _novo_entregador_id uuid, _motivo text)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path=public
AS $$ SELECT public.reatribuir_entrega(_order_id, _novo_entregador_id, _motivo, false, 'reatribuir:' || gen_random_uuid()::text) $$;

-- ───────────── 6. Conclusão pela portaria: dados explícitos, entregador válido ─────────────
CREATE OR REPLACE FUNCTION public.operador_concluir_entrega(_order_id uuid, _forma text, _valor_recebido numeric,
  _vasilhames_recebidos integer, _motivo_divergencia text, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid := public._ctx_org(); r record; c uuid; prev uuid; v numeric; f text; h text; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Conclusão exige chave de reenvio'; END IF;
  IF nullif(trim(coalesce(_forma,'')),'') IS NULL THEN RAISE EXCEPTION 'Informe a forma de pagamento efetiva'; END IF;
  IF _vasilhames_recebidos IS NULL THEN RAISE EXCEPTION 'Informe quantos cascos vazios foram recebidos (0 se nenhum)'; END IF;
  IF _vasilhames_recebidos < 0 THEN RAISE EXCEPTION 'Vasilhames inválidos'; END IF;
  f := public._forma_chave(_forma);
  IF coalesce(f,'') <> 'promissoria' AND _valor_recebido IS NULL THEN RAISE EXCEPTION 'Informe o valor realmente recebido'; END IF;
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
  v := CASE WHEN f = 'promissoria' THEN r.price ELSE _valor_recebido END;
  IF coalesce(f,'') <> 'promissoria' AND v IS DISTINCT FROM r.price THEN
    IF coalesce(length(trim(_motivo_divergencia)),0) < 5 THEN RAISE EXCEPTION 'Valor diferente do pedido exige motivo'; END IF;
    INSERT INTO public.divergencias(organization_id, order_id, esperado, recebido, motivo, registrado_por)
      VALUES (o, r.id, coalesce(r.price,0), coalesce(v,0), _motivo_divergencia, auth.uid());
  END IF;
  c := public._consumir_carga(o, r.delivery_person_id, r.product, coalesce(r.quantity,1), _vasilhames_recebidos, 0, 'consumo_entrega', r.id);
  IF f = 'promissoria' THEN
    PERFORM public._registrar_pagamento(o, r.id, 'entrega', _forma, r.price, r.client_id, r.client_name);
  ELSIF coalesce(v,0) > 0 THEN
    PERFORM public._registrar_pagamento(o, r.id, 'entrega', _forma, v, r.client_id, r.client_name);
  END IF;
  PERFORM set_config('g1.entrega_motivo', 'Concluída pela portaria', true);
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET status='completed', delivered_at=now(), payment_method=_forma, carga_id=c,
    vasilhames_recebidos=_vasilhames_recebidos, has_empty_cylinder=_vasilhames_recebidos>0 WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM set_config('g1.entrega_motivo', '', true);
  PERFORM public._reenvio_fim(o, _chave, r.id);
  RETURN r.id; END $$;

-- ───────────── 7. Regularização administrativa de registros antigos ─────────────
-- Só administrador; só entregas abertas com "Revisão necessária". Não presume preço, pagamento, entrega
-- realizada nem estoque: devolve à fila ou atribui por ID a um entregador do app (exige novo aceite).
CREATE OR REPLACE FUNCTION public.entrega_regularizar(_order_id uuid, _entregador_id uuid, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$ DECLARE o uuid := public._ctx_org(); r record; prev uuid; aid uuid; h text; mr text; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente o administrador regulariza registros antigos' USING ERRCODE='42501'; END IF;
  IF coalesce(length(trim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 caracteres)'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Regularização exige chave de reenvio'; END IF;
  IF _entregador_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles ur ON ur.user_id=p.id AND ur.role='entregador'
    WHERE p.id=_entregador_id AND p.organization_id=o AND p.ativo) THEN
    RAISE EXCEPTION 'Entregador inválido, inativo ou de outra empresa'; END IF;
  h := md5(concat_ws('|', _order_id::text, coalesce(_entregador_id::text,'-'), trim(_motivo)));
  prev := public._reenvio(o, _chave, 'entrega_regularizar', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  SELECT * INTO r FROM public.orders WHERE id=_order_id AND organization_id=o FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF NOT public._eh_entrega(r.origem_venda) OR NOT public._entrega_aberta(r.status) THEN
    RAISE EXCEPTION 'Só entregas em aberto podem ser regularizadas'; END IF;
  mr := public.entrega_motivo_revisao(r.status, r.delivery_person_id, r.delivery_person, r.accepted_at);
  IF mr IS NULL THEN RAISE EXCEPTION 'Este pedido não precisa de regularização: use atribuir ou reatribuir'; END IF;
  PERFORM set_config('g1.entrega_motivo', 'Regularização: ' || trim(_motivo), true);
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET
    status = CASE WHEN _entregador_id IS NULL THEN 'pending' ELSE 'assigned' END,
    delivery_person = _entregador_id::text, delivery_person_id = _entregador_id,
    assigned_at = CASE WHEN _entregador_id IS NULL THEN NULL ELSE now() END,
    accepted_at = NULL WHERE id=_order_id;
  PERFORM set_config('g1.acao_controlada','off',true);
  PERFORM set_config('g1.entrega_motivo', '', true);
  INSERT INTO public.auditoria_correcoes(organization_id, tabela, registro_id, antes, depois, motivo, feito_por)
    VALUES (o, 'orders', _order_id,
      jsonb_build_object('status', r.status, 'delivery_person', r.delivery_person, 'delivery_person_id', r.delivery_person_id,
        'assigned_at', r.assigned_at, 'accepted_at', r.accepted_at, 'revisao', mr),
      jsonb_build_object('status', CASE WHEN _entregador_id IS NULL THEN 'pending' ELSE 'assigned' END, 'delivery_person_id', _entregador_id),
      'Regularização: ' || trim(_motivo), auth.uid()) RETURNING id INTO aid;
  PERFORM public._reenvio_fim(o, _chave, aid);
  RETURN aid; END $$;

-- ───────────── 8. Permissões das funções ─────────────
REVOKE ALL ON FUNCTION public._entrega_log(), public._fechamento_guard_entregas(), public._entrega_guard(),
  public._entregas_pendentes_fechamento(uuid,date), public._travar_fechamento(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.entregas_bloqueando_fechamento(date), public.listar_entregadores(),
  public.reatribuir_entrega(uuid,uuid,text,boolean,text), public.reatribuir_entrega(uuid,uuid,text),
  public.operador_concluir_entrega(uuid,text,numeric,integer,text,text), public.entrega_regularizar(uuid,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.entregas_bloqueando_fechamento(date), public.listar_entregadores(),
  public.reatribuir_entrega(uuid,uuid,text,boolean,text), public.reatribuir_entrega(uuid,uuid,text),
  public.operador_concluir_entrega(uuid,text,numeric,integer,text,text), public.entrega_regularizar(uuid,uuid,text,text) TO authenticated;
