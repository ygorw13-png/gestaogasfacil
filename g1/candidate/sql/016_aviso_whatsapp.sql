-- 016: canal obrigatório na atribuição (App + WhatsApp / Só WhatsApp) e fila de envio de WhatsApp.
-- A atribuição e o pedido de envio são gravados na mesma transação; o envio é feito depois pelo servidor
-- (função whatsapp-envio) e nunca pelo navegador. "Só WhatsApp" fica recusado até o app receber respostas.

-- Vínculo explícito colaborador <-> conta do app (nunca por semelhança de nome).
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_org_user_uniq ON public.colaboradores(organization_id, user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.colaboradores_guard_vinculo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.user_id IS NOT DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.user_id END) THEN RETURN NEW; END IF;
  IF current_user IN ('authenticated','anon') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Só o administrador vincula o colaborador à conta do app' USING ERRCODE='42501'; END IF;
  IF NEW.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=NEW.user_id AND organization_id=NEW.organization_id) THEN
    RAISE EXCEPTION 'Conta do app inválida ou de outra empresa'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS colaboradores_guard_vinculo ON public.colaboradores;
CREATE TRIGGER colaboradores_guard_vinculo BEFORE INSERT OR UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.colaboradores_guard_vinculo();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS canal_aviso text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_canal_aviso_chk') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_canal_aviso_chk CHECK (canal_aviso IS NULL OR canal_aviso IN ('app_whatsapp','whatsapp'));
  END IF; END $$;

-- Configuração do WhatsApp da empresa (sem credenciais: elas ficam só no servidor).
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  organization_id uuid PRIMARY KEY,
  modelo text,
  idioma text NOT NULL DEFAULT 'pt_BR',
  envio_ativo boolean NOT NULL DEFAULT false,
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_config TO authenticated;
GRANT ALL ON public.whatsapp_config TO service_role;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wa config le" ON public.whatsapp_config;
CREATE POLICY "wa config le" ON public.whatsapp_config FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());
DROP POLICY IF EXISTS "wa config admin cria" ON public.whatsapp_config;
CREATE POLICY "wa config admin cria" ON public.whatsapp_config FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_my_org() AND public.is_admin());
DROP POLICY IF EXISTS "wa config admin altera" ON public.whatsapp_config;
CREATE POLICY "wa config admin altera" ON public.whatsapp_config FOR UPDATE TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_admin())
  WITH CHECK (organization_id = public.get_my_org() AND public.is_admin());

-- Fila de envio. Escrita só por funções do banco / servidor; a tela só lê.
CREATE TABLE IF NOT EXISTS public.whatsapp_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  entregador_id uuid NOT NULL,
  colaborador_id uuid,
  telefone text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('app_whatsapp','whatsapp')),
  chave text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando','enviando','enviado','entregue','lido','falha','incerto','cancelado')),
  provider_message_id text,
  erro text,
  tentativas integer NOT NULL DEFAULT 0,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  enviado_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, chave)
);
CREATE INDEX IF NOT EXISTS whatsapp_envios_order_idx ON public.whatsapp_envios(order_id);
GRANT SELECT ON public.whatsapp_envios TO authenticated;
GRANT ALL ON public.whatsapp_envios TO service_role;
ALTER TABLE public.whatsapp_envios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wa envios le" ON public.whatsapp_envios;
CREATE POLICY "wa envios le" ON public.whatsapp_envios FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());

-- Telefone para WhatsApp (Brasil): só dígitos, com 55; 12 ou 13 dígitos. Inválido = NULL.
CREATE OR REPLACE FUNCTION public._telefone_whatsapp(_t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN length(d) BETWEEN 12 AND 13 THEN d END FROM (
    SELECT CASE WHEN x LIKE '55%' AND length(x) >= 12 THEN x ELSE '55' || x END AS d
    FROM (SELECT ltrim(regexp_replace(coalesce(_t,''), '\D', '', 'g'), '0') AS x) a WHERE x <> '') b $$;

-- Destino do aviso: colaborador vinculado à conta do entregador, com telefone válido.
CREATE OR REPLACE FUNCTION public._destino_whatsapp(_org uuid, _entregador uuid, _canal text, OUT colaborador uuid, OUT telefone text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer; t text; BEGIN
  IF _canal IS NULL OR _canal NOT IN ('app_whatsapp','whatsapp') THEN
    RAISE EXCEPTION 'Escolha o canal do aviso: App + WhatsApp ou Só WhatsApp'; END IF;
  IF _canal = 'whatsapp' THEN
    RAISE EXCEPTION 'Só WhatsApp ainda não está disponível: depende de o sistema receber o aceite/recusa pelo WhatsApp'; END IF;
  SELECT count(*) INTO n FROM public.colaboradores c WHERE c.organization_id=_org AND c.user_id=_entregador;
  IF n = 0 THEN RAISE EXCEPTION 'Entregador sem cadastro de colaborador vinculado à conta do app (Colaboradores > Editar > Conta no app)'; END IF;
  SELECT c.id, c.telefone INTO colaborador, t FROM public.colaboradores c WHERE c.organization_id=_org AND c.user_id=_entregador;
  telefone := public._telefone_whatsapp(t);
  IF telefone IS NULL THEN RAISE EXCEPTION 'Telefone do entregador inválido para WhatsApp (cadastre DDD + número em Colaboradores)'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public._whatsapp_enfileirar(_org uuid, _order uuid, _entregador uuid, _canal text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d record; id_ uuid; ex record; antes text := coalesce(current_setting('g1.acao_controlada',true),''); BEGIN
  SELECT * INTO d FROM public._destino_whatsapp(_org, _entregador, _canal);
  INSERT INTO public.whatsapp_envios(organization_id, order_id, entregador_id, colaborador_id, telefone, canal, chave, criado_por)
    VALUES (_org, _order, _entregador, d.colaborador, d.telefone, _canal, _chave, auth.uid())
    ON CONFLICT (organization_id, chave) DO NOTHING RETURNING id INTO id_;
  IF id_ IS NULL THEN
    SELECT * INTO ex FROM public.whatsapp_envios WHERE organization_id=_org AND chave=_chave;
    IF ex.order_id <> _order OR ex.entregador_id <> _entregador OR ex.canal <> _canal THEN
      RAISE EXCEPTION 'Chave já usada com outro conteúdo'; END IF;
    RETURN ex.id;
  END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  UPDATE public.orders SET canal_aviso=_canal WHERE id=_order;
  PERFORM set_config('g1.acao_controlada',antes,true);
  RETURN id_; END $$;

CREATE OR REPLACE FUNCTION public.atribuir_entrega_aviso(_order_id uuid, _entregador_id uuid, _retirar_da_portaria boolean, _chave text, _canal text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Atribuição exige chave de reenvio'; END IF;
  PERFORM public._destino_whatsapp(o, _entregador_id, _canal);
  PERFORM public.atribuir_entrega(_order_id, _entregador_id, coalesce(_retirar_da_portaria,false), _chave);
  RETURN public._whatsapp_enfileirar(o, _order_id, _entregador_id, _canal, _chave); END $$;

CREATE OR REPLACE FUNCTION public.reatribuir_entrega_aviso(_order_id uuid, _novo_entregador_id uuid, _motivo text, _transferir_carga boolean, _chave text, _canal text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _novo_entregador_id IS NULL THEN RAISE EXCEPTION 'Escolha o novo entregador'; END IF;
  PERFORM public._destino_whatsapp(o, _novo_entregador_id, _canal);
  PERFORM public.reatribuir_entrega(_order_id, _novo_entregador_id, _motivo, coalesce(_transferir_carga,false), _chave);
  -- Envios ainda não feitos ao responsável anterior são cancelados (os já enviados ficam como estão).
  UPDATE public.whatsapp_envios SET status='cancelado', erro='Pedido reatribuído antes do envio', atualizado_em=now()
   WHERE organization_id=o AND order_id=_order_id AND entregador_id <> _novo_entregador_id
     AND status IN ('aguardando','falha','incerto');
  RETURN public._whatsapp_enfileirar(o, _order_id, _novo_entregador_id, _canal, _chave); END $$;

-- Servidor: reserva um envio (trava o pedido para não cruzar com uma reatribuição).
CREATE OR REPLACE FUNCTION public.whatsapp_envio_reservar(_envio uuid, _confirmar_incerto boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e record; r record; BEGIN
  SELECT * INTO e FROM public.whatsapp_envios WHERE id=_envio;
  IF e.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'motivo', 'Envio não encontrado'); END IF;
  SELECT * INTO r FROM public.orders WHERE id=e.order_id FOR UPDATE;
  SELECT * INTO e FROM public.whatsapp_envios WHERE id=_envio FOR UPDATE;
  IF e.status = 'incerto' AND NOT coalesce(_confirmar_incerto,false) THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'Resultado incerto: confira no celular do entregador antes de reenviar'); END IF;
  IF e.status NOT IN ('aguardando','falha','incerto') THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'Envio não está pendente (' || e.status || ')'); END IF;
  IF r.delivery_person_id IS DISTINCT FROM e.entregador_id OR r.status NOT IN ('assigned','delivering') THEN
    UPDATE public.whatsapp_envios SET status='cancelado', erro='Pedido não está mais com este entregador', atualizado_em=now() WHERE id=_envio;
    RETURN jsonb_build_object('ok', false, 'motivo', 'Pedido não está mais com este entregador'); END IF;
  UPDATE public.whatsapp_envios SET status='enviando', tentativas=tentativas+1, erro=NULL, atualizado_em=now() WHERE id=_envio;
  RETURN jsonb_build_object('ok', true, 'telefone', e.telefone, 'order', jsonb_build_object(
    'id', r.id, 'client_name', r.client_name, 'address', r.address, 'product', r.product, 'quantity', r.quantity,
    'price', r.price, 'payment_method', r.payment_method, 'notes', r.notes)); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_envio_resultado(_envio uuid, _status text, _provider_id text, _erro text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _status NOT IN ('enviado','falha','incerto') THEN RAISE EXCEPTION 'Resultado inválido'; END IF;
  UPDATE public.whatsapp_envios SET status=_status, provider_message_id=coalesce(_provider_id, provider_message_id),
    erro=left(_erro, 500), enviado_em=CASE WHEN _status='enviado' THEN now() ELSE enviado_em END, atualizado_em=now()
   WHERE id=_envio AND status='enviando';
  IF NOT FOUND THEN RAISE EXCEPTION 'Envio não estava reservado'; END IF;
END $$;

REVOKE ALL ON FUNCTION public._telefone_whatsapp(text), public._destino_whatsapp(uuid,uuid,text),
  public._whatsapp_enfileirar(uuid,uuid,uuid,text,text), public.whatsapp_envio_reservar(uuid,boolean),
  public.whatsapp_envio_resultado(uuid,text,text,text), public.colaboradores_guard_vinculo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_envio_reservar(uuid,boolean), public.whatsapp_envio_resultado(uuid,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.atribuir_entrega_aviso(uuid,uuid,boolean,text,text),
  public.reatribuir_entrega_aviso(uuid,uuid,text,boolean,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atribuir_entrega_aviso(uuid,uuid,boolean,text,text),
  public.reatribuir_entrega_aviso(uuid,uuid,text,boolean,text,text) TO authenticated, service_role;

-- Lista para as telas de atribuição: entregadores ativos com a situação do vínculo e do telefone
-- (o operador não lê o cadastro de colaboradores; aqui só vê o necessário, telefone mascarado).
CREATE OR REPLACE FUNCTION public.listar_entregadores_aviso()
RETURNS TABLE(id uuid, nome text, vinculado boolean, telefone_valido boolean, telefone_final text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.id, p.name, c.id IS NOT NULL, public._telefone_whatsapp(c.telefone) IS NOT NULL,
      CASE WHEN public._telefone_whatsapp(c.telefone) IS NOT NULL THEN right(public._telefone_whatsapp(c.telefone), 4) END
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'entregador'
    LEFT JOIN public.colaboradores c ON c.organization_id = o AND c.user_id = p.id
   WHERE p.organization_id = o AND p.ativo ORDER BY p.name;
END $$;
REVOKE ALL ON FUNCTION public.listar_entregadores_aviso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_aviso() TO authenticated, service_role;
