-- G1 013 — Fechamento total: bloqueia toda entrega aberta com data ≤ dia do fechamento (sem limite de antiguidade).
-- Data da entrega = entrega_prevista ou, sem ela, o dia operacional (Bahia) da criação (_entrega_data, 012).
-- Fora: agendamentos futuros, balcão/retirada (_eh_entrega), concluídas e canceladas (_entrega_aberta).
-- Mesma trava consultiva (_travar_fechamento) no fechamento e nas gravações de pedidos. Nenhum dado é alterado.

CREATE OR REPLACE FUNCTION public._entregas_pendentes_fechamento(_org uuid, _data date)
RETURNS TABLE(id uuid, client_name text, status text, data_prevista date, delivery_person_id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.id, o.client_name, o.status, public._entrega_data(o.entrega_prevista, o.created_at), o.delivery_person_id, o.created_at
    FROM public.orders o
   WHERE o.organization_id = _org AND public._eh_entrega(o.origem_venda) AND public._entrega_aberta(o.status)
     AND public._entrega_data(o.entrega_prevista, o.created_at) <= _data
   ORDER BY 4, o.created_at $$;

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
    RAISE EXCEPTION 'Fechamento total bloqueado: % entrega(s) em aberto com previsão até %. Conclua, reatribua ou cancele em Pedidos antes de fechar',
      n, to_char(d, 'DD/MM/YYYY') USING ERRCODE='P0001', HINT='entregas_pendentes';
  END IF;
  RETURN NEW; END $$;

-- Entrega nova/reaberta/reagendada não pode cair em data já coberta por um fechamento total (data ≤ fechamento).
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
              AND f.data_fechamento >= d) THEN
    RAISE EXCEPTION 'O caixa que cobre % já teve fechamento total. Informe outra data prevista para a entrega',
      to_char(d, 'DD/MM/YYYY') USING ERRCODE='P0001'; END IF;
  RETURN NEW; END $$;

REVOKE ALL ON FUNCTION public._fechamento_guard_entregas(), public._entrega_guard(),
  public._entregas_pendentes_fechamento(uuid,date) FROM PUBLIC, anon, authenticated;
