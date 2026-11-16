-- 018: provedor "Aplicativo do PC" para os avisos de entrega pelo WhatsApp (aditivo).
-- O app Windows só faz POST HTTPS de saída para a função whatsapp-desktop; QR/sessão nunca vêm ao servidor.
-- Códigos de pareamento, tokens de dispositivo e tokens de tentativa ficam só como hash (sha256 hex).
-- Nenhum envio antigo (Meta) passa para o PC: todos os existentes ficam com provedor 'meta'.

ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS provedor text NOT NULL DEFAULT 'meta';
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS desktop_telefone text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='whatsapp_config_provedor_chk') THEN
    ALTER TABLE public.whatsapp_config ADD CONSTRAINT whatsapp_config_provedor_chk CHECK (provedor IN ('meta','desktop')); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='whatsapp_config_desktop_tel_chk') THEN
    ALTER TABLE public.whatsapp_config ADD CONSTRAINT whatsapp_config_desktop_tel_chk CHECK (desktop_telefone IS NULL OR desktop_telefone ~ '^55[0-9]{10,11}$'); END IF;
END $$;

ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS provedor text NOT NULL DEFAULT 'meta';
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS dispositivo_id uuid;
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS tentativa_hash text;
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS lease_ate timestamptz;
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS iniciado_em timestamptz;
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS resultado_origem text;
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS reenvio_de uuid REFERENCES public.whatsapp_envios(id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='whatsapp_envios_provedor_chk') THEN
    ALTER TABLE public.whatsapp_envios ADD CONSTRAINT whatsapp_envios_provedor_chk CHECK (provedor IN ('meta','desktop')); END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_envios_reenvio_uniq ON public.whatsapp_envios(reenvio_de) WHERE reenvio_de IS NOT NULL;
CREATE INDEX IF NOT EXISTS whatsapp_envios_desktop_fila_idx ON public.whatsapp_envios(organization_id, criado_em) WHERE provedor='desktop' AND status IN ('aguardando','enviando');

-- Operadores leem a fila, mas nunca o hash da tentativa.
REVOKE SELECT ON public.whatsapp_envios FROM authenticated;
GRANT SELECT (id, organization_id, order_id, entregador_id, colaborador_id, telefone, canal, chave, status, provider_message_id,
  erro, tentativas, criado_por, criado_em, enviado_em, atualizado_em, provedor, iniciado_em, reenvio_de) ON public.whatsapp_envios TO authenticated;

-- Pareamentos e dispositivos: só o servidor (service_role) acessa; nenhuma política para usuários.
CREATE TABLE IF NOT EXISTS public.whatsapp_desktop_pareamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  codigo_hash text NOT NULL UNIQUE,
  expira_em timestamptz NOT NULL,
  usado_em timestamptz,
  criado_por uuid,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_desktop_pareamentos TO service_role;
ALTER TABLE public.whatsapp_desktop_pareamentos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_desktop_dispositivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  estado text NOT NULL DEFAULT 'disconnected' CHECK (estado IN ('connected','disconnected')),
  telefone_reportado text,
  pausado boolean NOT NULL DEFAULT false,
  app_version text,
  ultimo_contato timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  revogado_em timestamptz,
  revogado_por uuid
);
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_desktop_um_ativo ON public.whatsapp_desktop_dispositivos(organization_id) WHERE ativo;
GRANT ALL ON public.whatsapp_desktop_dispositivos TO service_role;
ALTER TABLE public.whatsapp_desktop_dispositivos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_desktop_limites (
  chave text NOT NULL,
  janela timestamptz NOT NULL,
  n integer NOT NULL DEFAULT 0,
  PRIMARY KEY (chave, janela)
);
GRANT ALL ON public.whatsapp_desktop_limites TO service_role;
ALTER TABLE public.whatsapp_desktop_limites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public._wd_hash(_t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(sha256(convert_to(_t, 'UTF8')), 'hex') $$;
-- 244 bits aleatórios (dois UUID v4 do gerador forte do PostgreSQL), em hex.
CREATE OR REPLACE FUNCTION public._wd_segredo() RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') $$;

-- Conta uma tentativa na janela; devolve false quando passou do limite.
CREATE OR REPLACE FUNCTION public._wd_limite(_chave text, _max integer, _segundos integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE j timestamptz := to_timestamp(floor(extract(epoch FROM now()) / _segundos) * _segundos); c integer; BEGIN
  DELETE FROM public.whatsapp_desktop_limites WHERE janela < now() - interval '1 day';
  INSERT INTO public.whatsapp_desktop_limites(chave, janela, n) VALUES (_chave, j, 1)
    ON CONFLICT (chave, janela) DO UPDATE SET n = whatsapp_desktop_limites.n + 1 RETURNING n INTO c;
  RETURN c <= _max; END $$;

CREATE OR REPLACE FUNCTION public._wd_negado(_origem text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public._wd_limite('auth:' || coalesce(_origem, '?'), 30, 600) THEN
    RETURN jsonb_build_object('error', 'Muitas tentativas inválidas; aguarde alguns minutos', 'status', 429); END IF;
  RETURN jsonb_build_object('error', 'Dispositivo não autorizado ou revogado', 'status', 401); END $$;

-- Texto do aviso: derivado só do pedido já atribuído (o dispositivo nunca escolhe destinatário nem texto).
-- Retirada de agregado nunca mostra valor (preço sigiloso, candidato 017).
CREATE OR REPLACE FUNCTION public._wd_texto(_order uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; a jsonb; ender text; valor text; forma text;
  p text[] := ARRAY['street','number','complement','neighborhood','city','reference']; k text; partes text[] := '{}';
BEGIN
  SELECT * INTO r FROM public.orders WHERE id = _order;
  a := to_jsonb(r.address);
  IF jsonb_typeof(a) = 'object' THEN
    FOREACH k IN ARRAY p LOOP
      IF nullif(btrim(a->>k), '') IS NOT NULL THEN partes := partes || btrim(a->>k); END IF;
    END LOOP;
  END IF;
  ender := nullif(array_to_string(partes, ', '), '');
  IF r.payment_method = 'agregado' THEN
    valor := 'reservado ao administrador'; forma := 'Retirada de agregado — a acertar';
  ELSE
    valor := CASE WHEN r.price IS NOT NULL AND r.price > 0
      THEN 'R$ ' || replace(replace(replace(to_char(r.price, 'FM999G999G990D00'), ',', '#'), '.', ','), '#', '.') ELSE 'não informado' END;
    forma := CASE r.payment_method WHEN 'money' THEN 'Dinheiro' WHEN 'pix' THEN 'PIX' WHEN 'credit' THEN 'Crédito'
      WHEN 'debit' THEN 'Débito' WHEN 'promissoria' THEN 'Nota promissória' WHEN 'vale-gas' THEN 'Vale-gás'
      WHEN 'gas-povo' THEN 'Gás do Povo' WHEN 'convenio' THEN 'Convênio' ELSE coalesce(r.payment_method, 'não informado') END;
  END IF;
  RETURN left(regexp_replace(
    'Nova entrega do GásFácil para você. Pedido #' || upper(left(replace(r.id::text, '-', ''), 8)) ||
    '. Cliente: ' || coalesce(nullif(btrim(r.client_name), ''), 'não informado') ||
    '. Endereço: ' || coalesce(ender, 'não informado') ||
    '. Produto: ' || coalesce(nullif(btrim(r.product), ''), 'não informado') || ', quantidade ' || coalesce(r.quantity, 1) ||
    '. Valor: ' || valor || '. Pagamento: ' || forma ||
    '. Observações: ' || coalesce(nullif(btrim(r.notes), ''), 'nenhuma') ||
    '. Confira os dados antes de sair e responda pelo aplicativo do GásFácil.', '[\r\n\t]+', ' ', 'g'), 1500); END $$;

-- Proteções da configuração: trocar provedor ou número esperado DESLIGA o envio; ligar o envio do PC só por função própria.
-- Desligar o envio do PC cancela o que ainda não começou (nada é enviado depois, de surpresa).
CREATE OR REPLACE FUNCTION public.whatsapp_config_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.provedor IS DISTINCT FROM OLD.provedor OR NEW.desktop_telefone IS DISTINCT FROM OLD.desktop_telefone) THEN
    NEW.envio_ativo := false; END IF;
  IF NEW.envio_ativo AND NEW.provedor = 'desktop' AND (TG_OP = 'INSERT' OR NOT OLD.envio_ativo)
     AND coalesce(current_setting('g1.wa_desktop', true), '') <> 'on' THEN
    RAISE EXCEPTION 'O envio pelo Aplicativo do PC só é ligado em Configurações > WhatsApp' USING ERRCODE = '42501'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS whatsapp_config_guard ON public.whatsapp_config;
CREATE TRIGGER whatsapp_config_guard BEFORE INSERT OR UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_config_guard();

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
DROP TRIGGER IF EXISTS whatsapp_config_desligou ON public.whatsapp_config;
CREATE TRIGGER whatsapp_config_desligou AFTER UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_config_desligou();

-- Fila: o provedor do envio é o selecionado no momento da atribuição. PC desligado = falha registrada, nunca fila parada.
CREATE OR REPLACE FUNCTION public._whatsapp_enfileirar(_org uuid, _order uuid, _entregador uuid, _canal text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d record; id_ uuid; ex record; c record; prov text; st text := 'aguardando'; er text;
  antes text := coalesce(current_setting('g1.acao_controlada',true),''); BEGIN
  SELECT * INTO d FROM public._destino_whatsapp(_org, _entregador, _canal);
  SELECT provedor, envio_ativo INTO c FROM public.whatsapp_config WHERE organization_id = _org;
  prov := coalesce(c.provedor, 'meta');
  IF prov = 'desktop' AND NOT coalesce(c.envio_ativo, false) THEN
    st := 'falha'; er := 'Envio pelo Aplicativo do PC desligado (Configurações > WhatsApp)'; END IF;
  INSERT INTO public.whatsapp_envios(organization_id, order_id, entregador_id, colaborador_id, telefone, canal, chave, criado_por, provedor, status, erro)
    VALUES (_org, _order, _entregador, d.colaborador, d.telefone, _canal, _chave, auth.uid(), prov, st, er)
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

-- Reatribuição: também cancela envios do PC já reservados mas ainda não iniciados.
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

-- O envio pela Meta nunca processa envios do PC.
CREATE OR REPLACE FUNCTION public.whatsapp_envio_reservar(_envio uuid, _confirmar_incerto boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e record; r record; BEGIN
  SELECT * INTO e FROM public.whatsapp_envios WHERE id=_envio;
  IF e.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'motivo', 'Envio não encontrado'); END IF;
  IF e.provedor <> 'meta' THEN RETURN jsonb_build_object('ok', false, 'motivo', 'Este aviso é do Aplicativo do PC'); END IF;
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
    'price', CASE WHEN r.payment_method = 'agregado' THEN NULL ELSE r.price END, 'payment_method', r.payment_method, 'notes', r.notes)); END $$;

-- Prazos vencidos: iniciado sem resultado = INCERTO; só reservado = FALHA (não enviado). O mesmo job_id nunca é oferecido de novo.
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

-- ===== Funções do administrador (tela Configurações > WhatsApp) =====
CREATE OR REPLACE FUNCTION public._wd_admin() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador' USING ERRCODE = '42501'; END IF;
  o := public.get_my_org();
  IF o IS NULL THEN RAISE EXCEPTION 'Sem empresa' USING ERRCODE = '42501'; END IF;
  RETURN o; END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._wd_admin(); c record; d record; BEGIN
  SELECT * INTO c FROM public.whatsapp_config WHERE organization_id = o;
  SELECT * INTO d FROM public.whatsapp_desktop_dispositivos WHERE organization_id = o AND ativo;
  RETURN jsonb_build_object('provedor', coalesce(c.provedor, 'meta'), 'envio_ativo', coalesce(c.envio_ativo, false),
    'telefone_esperado', c.desktop_telefone,
    'dispositivo', CASE WHEN d.id IS NULL THEN NULL ELSE jsonb_build_object('id', d.id, 'nome', d.nome, 'estado', d.estado,
      'telefone', d.telefone_reportado, 'pausado', d.pausado, 'app_version', d.app_version, 'ultimo_contato', d.ultimo_contato,
      'criado_em', d.criado_em, 'pronto', (d.estado = 'connected' AND NOT d.pausado AND d.ultimo_contato > now() - interval '45 seconds'
        AND d.telefone_reportado IS NOT DISTINCT FROM c.desktop_telefone AND c.desktop_telefone IS NOT NULL)) END); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_provedor_definir(_provedor text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._wd_admin(); BEGIN
  IF _provedor IS NULL OR _provedor NOT IN ('meta','desktop') THEN RAISE EXCEPTION 'Provedor inválido'; END IF;
  INSERT INTO public.whatsapp_config(organization_id, provedor, envio_ativo, atualizado_por, atualizado_em)
    VALUES (o, _provedor, false, auth.uid(), now())
    ON CONFLICT (organization_id) DO UPDATE SET provedor = EXCLUDED.provedor, envio_ativo = false,
      atualizado_por = EXCLUDED.atualizado_por, atualizado_em = now();
  RETURN public.whatsapp_desktop_status(); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_telefone_definir(_telefone text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._wd_admin(); t text := public._telefone_whatsapp(_telefone); BEGIN
  IF t IS NULL THEN RAISE EXCEPTION 'Número inválido: informe DDD + número (Brasil)'; END IF;
  INSERT INTO public.whatsapp_config(organization_id, desktop_telefone, envio_ativo, atualizado_por, atualizado_em)
    VALUES (o, t, false, auth.uid(), now())
    ON CONFLICT (organization_id) DO UPDATE SET desktop_telefone = EXCLUDED.desktop_telefone,
      atualizado_por = EXCLUDED.atualizado_por, atualizado_em = now();
  RETURN public.whatsapp_desktop_status(); END $$;

-- Código de pareamento: exibido UMA vez, 10 minutos, guardado só como hash; anula códigos anteriores não usados.
CREATE OR REPLACE FUNCTION public.whatsapp_desktop_gerar_pareamento() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._wd_admin(); c record; cod text := public._wd_segredo(); exp timestamptz := now() + interval '10 minutes'; BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('wd:' || o));
  SELECT * INTO c FROM public.whatsapp_config WHERE organization_id = o;
  IF coalesce(c.provedor, 'meta') <> 'desktop' THEN RAISE EXCEPTION 'Selecione o provedor Aplicativo do PC antes de gerar a configuração'; END IF;
  IF c.desktop_telefone IS NULL THEN RAISE EXCEPTION 'Informe o número do WhatsApp esperado antes de gerar a configuração'; END IF;
  IF EXISTS (SELECT 1 FROM public.whatsapp_desktop_dispositivos WHERE organization_id = o AND ativo) THEN
    RAISE EXCEPTION 'Já existe um aplicativo do PC ativo. Revogue-o antes de parear outro'; END IF;
  IF (SELECT count(*) FROM public.whatsapp_desktop_pareamentos WHERE organization_id = o AND criado_em > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'Muitas configurações geradas na última hora; aguarde'; END IF;
  UPDATE public.whatsapp_desktop_pareamentos SET expira_em = now() WHERE organization_id = o AND usado_em IS NULL AND expira_em > now();
  INSERT INTO public.whatsapp_desktop_pareamentos(organization_id, codigo_hash, expira_em, criado_por) VALUES (o, public._wd_hash(cod), exp, auth.uid());
  RETURN jsonb_build_object('pairing_code', cod, 'expira_em', exp); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_ativar(_ativo boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._wd_admin(); c record; antes text := coalesce(current_setting('g1.wa_desktop', true), ''); BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('wd:' || o));
  SELECT * INTO c FROM public.whatsapp_config WHERE organization_id = o FOR UPDATE;
  IF coalesce(_ativo, false) THEN
    IF coalesce(c.provedor, 'meta') <> 'desktop' THEN RAISE EXCEPTION 'O provedor selecionado não é o Aplicativo do PC'; END IF;
    IF c.desktop_telefone IS NULL THEN RAISE EXCEPTION 'Informe o número do WhatsApp esperado'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.whatsapp_desktop_dispositivos WHERE organization_id = o AND ativo) THEN
      RAISE EXCEPTION 'Nenhum aplicativo do PC pareado'; END IF;
  END IF;
  IF c.organization_id IS NULL THEN RETURN public.whatsapp_desktop_status(); END IF;
  PERFORM set_config('g1.wa_desktop', 'on', true);
  UPDATE public.whatsapp_config SET envio_ativo = coalesce(_ativo, false), atualizado_por = auth.uid(), atualizado_em = now() WHERE organization_id = o;
  PERFORM set_config('g1.wa_desktop', antes, true);
  RETURN public.whatsapp_desktop_status(); END $$;

-- Revogar: o token deixa de valer na hora, o envio do PC é desligado; reservas não iniciadas são canceladas
-- (pelo gatilho de desligar) e as já iniciadas viram "incerto" quando o prazo vencer.
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

-- Reenvio MANUAL (operador): novo envio ligado ao anterior; incerto exige confirmação explícita. Nunca automático.
CREATE OR REPLACE FUNCTION public.whatsapp_desktop_reenviar(_envio uuid, _confirmar_incerto boolean, _chave text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); e record; r record; c record; d record; id_ uuid; BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501'; END IF;
  IF _chave IS NULL OR length(_chave) < 8 THEN RAISE EXCEPTION 'Reenvio exige chave de reenvio'; END IF;
  SELECT * INTO e FROM public.whatsapp_envios WHERE id = _envio AND organization_id = o;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Aviso não encontrado'; END IF;
  SELECT id INTO id_ FROM public.whatsapp_envios WHERE organization_id = o AND chave = _chave;
  IF id_ IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.whatsapp_envios WHERE id = id_ AND reenvio_de = _envio) THEN RAISE EXCEPTION 'Chave já usada com outro conteúdo'; END IF;
    RETURN id_; END IF;
  PERFORM public._wd_vencer(o);
  SELECT * INTO r FROM public.orders WHERE id = e.order_id FOR UPDATE;
  SELECT * INTO e FROM public.whatsapp_envios WHERE id = _envio FOR UPDATE;
  IF e.provedor <> 'desktop' THEN RAISE EXCEPTION 'Este aviso não é do Aplicativo do PC'; END IF;
  IF e.status = 'incerto' AND NOT coalesce(_confirmar_incerto, false) THEN
    RAISE EXCEPTION 'Resultado incerto: confirme que conferiu no celular do entregador e a mensagem não chegou'; END IF;
  IF e.status NOT IN ('falha', 'incerto') THEN RAISE EXCEPTION 'Só um aviso com falha ou incerto pode ser reenviado'; END IF;
  IF EXISTS (SELECT 1 FROM public.whatsapp_envios WHERE reenvio_de = _envio) THEN RAISE EXCEPTION 'Este aviso já foi reenviado'; END IF;
  IF r.delivery_person_id IS DISTINCT FROM e.entregador_id OR r.status NOT IN ('assigned', 'delivering') THEN
    RAISE EXCEPTION 'Pedido não está mais com este entregador'; END IF;
  IF EXISTS (SELECT 1 FROM public.whatsapp_envios WHERE organization_id = o AND order_id = e.order_id AND provedor = 'desktop'
             AND status IN ('aguardando', 'enviando')) THEN RAISE EXCEPTION 'Já existe um aviso deste pedido aguardando envio'; END IF;
  SELECT provedor, envio_ativo INTO c FROM public.whatsapp_config WHERE organization_id = o;
  IF coalesce(c.provedor, 'meta') <> 'desktop' OR NOT coalesce(c.envio_ativo, false) THEN
    RAISE EXCEPTION 'Envio pelo Aplicativo do PC desligado (Configurações > WhatsApp)'; END IF;
  SELECT * INTO d FROM public._destino_whatsapp(o, e.entregador_id, e.canal);
  INSERT INTO public.whatsapp_envios(organization_id, order_id, entregador_id, colaborador_id, telefone, canal, chave, criado_por, provedor, reenvio_de)
    VALUES (o, e.order_id, e.entregador_id, d.colaborador, d.telefone, e.canal, _chave, auth.uid(), 'desktop', _envio) RETURNING id INTO id_;
  RETURN id_; END $$;

-- ===== Funções do dispositivo (só a função whatsapp-desktop, com service_role) =====
-- Retornam jsonb; erros esperados vêm como {error, status} para que os contadores de limite não sejam desfeitos.
CREATE OR REPLACE FUNCTION public.whatsapp_desktop_parear(_codigo_hash text, _nome text, _token_hash text, _origem text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid; did uuid; c record; BEGIN
  IF NOT public._wd_limite('pair:' || coalesce(_origem, '?'), 10, 600) OR NOT public._wd_limite('pair:*', 120, 600) THEN
    RETURN jsonb_build_object('error', 'Muitas tentativas de pareamento; aguarde alguns minutos', 'status', 429); END IF;
  UPDATE public.whatsapp_desktop_pareamentos SET usado_em = now()
   WHERE codigo_hash = _codigo_hash AND usado_em IS NULL AND expira_em > now() RETURNING organization_id INTO o;
  IF o IS NULL THEN RETURN jsonb_build_object('error', 'Código de pareamento inválido, expirado ou já usado', 'status', 401); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('wd:' || o));
  SELECT * INTO c FROM public.whatsapp_config WHERE organization_id = o;
  IF coalesce(c.provedor, 'meta') <> 'desktop' OR c.desktop_telefone IS NULL THEN
    RETURN jsonb_build_object('error', 'O provedor Aplicativo do PC não está selecionado', 'status', 409); END IF;
  IF EXISTS (SELECT 1 FROM public.whatsapp_desktop_dispositivos WHERE organization_id = o AND ativo) THEN
    RETURN jsonb_build_object('error', 'Já existe um aplicativo do PC ativo para esta empresa', 'status', 409); END IF;
  INSERT INTO public.whatsapp_desktop_dispositivos(organization_id, token_hash, nome)
    VALUES (o, _token_hash, left(coalesce(nullif(btrim(_nome), ''), 'PC'), 80)) RETURNING id INTO did;
  RETURN jsonb_build_object('device_id', did, 'company_name', (SELECT name FROM public.organizations WHERE id = o),
    'expected_phone', c.desktop_telefone); END $$;

CREATE OR REPLACE FUNCTION public.whatsapp_desktop_heartbeat(_token_hash text, _estado text, _telefone text, _pausado boolean, _versao text, _origem text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d record; BEGIN
  SELECT * INTO d FROM public.whatsapp_desktop_dispositivos WHERE token_hash = _token_hash AND ativo;
  IF d.id IS NULL THEN RETURN public._wd_negado(_origem); END IF;
  UPDATE public.whatsapp_desktop_dispositivos SET estado = _estado, telefone_reportado = _telefone, pausado = _pausado,
    app_version = left(_versao, 20), ultimo_contato = now() WHERE id = d.id;
  RETURN jsonb_build_object('ok', true); END $$;

CREATE OR REPLACE FUNCTION public._wd_pronto(d public.whatsapp_desktop_dispositivos, c public.whatsapp_config, _telefone text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT c.organization_id IS NOT NULL AND c.provedor = 'desktop' AND c.envio_ativo AND c.desktop_telefone IS NOT NULL
     AND d.telefone_reportado = c.desktop_telefone AND _telefone = c.desktop_telefone
     AND d.estado = 'connected' AND NOT d.pausado AND d.ultimo_contato > now() - interval '45 seconds' $$;

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

REVOKE ALL ON FUNCTION public._wd_hash(text), public._wd_segredo(), public._wd_limite(text,integer,integer), public._wd_negado(text),
  public._wd_texto(uuid), public._wd_admin(), public._wd_vencer(uuid), public._wd_pronto(public.whatsapp_desktop_dispositivos, public.whatsapp_config, text),
  public.whatsapp_config_guard(), public.whatsapp_config_desligou(),
  public.whatsapp_desktop_parear(text,text,text,text), public.whatsapp_desktop_heartbeat(text,text,text,boolean,text,text),
  public.whatsapp_desktop_poll(text,text,text), public.whatsapp_desktop_begin(text,uuid,text,text,text),
  public.whatsapp_desktop_resultado(text,uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_desktop_parear(text,text,text,text), public.whatsapp_desktop_heartbeat(text,text,text,boolean,text,text),
  public.whatsapp_desktop_poll(text,text,text), public.whatsapp_desktop_begin(text,uuid,text,text,text),
  public.whatsapp_desktop_resultado(text,uuid,text,text,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.whatsapp_desktop_status(), public.whatsapp_provedor_definir(text), public.whatsapp_desktop_telefone_definir(text),
  public.whatsapp_desktop_gerar_pareamento(), public.whatsapp_desktop_ativar(boolean), public.whatsapp_desktop_revogar(),
  public.whatsapp_desktop_reenviar(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_desktop_status(), public.whatsapp_provedor_definir(text), public.whatsapp_desktop_telefone_definir(text),
  public.whatsapp_desktop_gerar_pareamento(), public.whatsapp_desktop_ativar(boolean), public.whatsapp_desktop_revogar(),
  public.whatsapp_desktop_reenviar(uuid,boolean,text) TO authenticated, service_role;

-- Também sem privilégios herdados (projetos com privilégios padrão para anon/authenticated).
REVOKE ALL ON public.whatsapp_desktop_pareamentos, public.whatsapp_desktop_dispositivos, public.whatsapp_desktop_limites FROM PUBLIC, anon, authenticated;
