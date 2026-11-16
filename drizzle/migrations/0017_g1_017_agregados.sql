-- 017: agregados. Retirada pela portaria por quantidade (sem preço), preço sigiloso só do administrador,
-- "por conta" (dinheiro recebido e ainda livre) e acerto do administrador vinculado às retiradas.
-- A retirada é o próprio pedido (orders.payment_method = 'agregado', price NULL): Vendas recentes, Histórico
-- e ficha do agregado usam o mesmo identificador. Não cria promissória nem recebimento.

-- 1. Preço confidencial ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agregado_precos (
  reseller_id uuid NOT NULL REFERENCES public.resellers(id),
  produto text NOT NULL CHECK (produto IN ('P13','P20','P45','agua')),
  organization_id uuid NOT NULL,
  preco numeric(12,2) NOT NULL CHECK (preco > 0),
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reseller_id, produto)
);
GRANT SELECT ON public.agregado_precos TO authenticated;
GRANT ALL ON public.agregado_precos TO service_role;
ALTER TABLE public.agregado_precos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "g1 admin le precos" ON public.agregado_precos;
CREATE POLICY "g1 admin le precos" ON public.agregado_precos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_admin());
-- preços já cadastrados preservados (cópia; a coluna antiga fica intacta, só sem acesso pelo app)
INSERT INTO public.agregado_precos(reseller_id, produto, organization_id, preco, atualizado_em)
  SELECT id, 'P13', organization_id, price_p13, updated_at FROM public.resellers WHERE price_p13 > 0
  ON CONFLICT DO NOTHING;

REVOKE SELECT, INSERT, UPDATE ON public.resellers FROM anon, authenticated;
GRANT SELECT (id, organization_id, name, phone, contact_person, address, notes, active, created_at, updated_at) ON public.resellers TO authenticated;
GRANT INSERT (organization_id, name, phone, contact_person, address, notes, active) ON public.resellers TO authenticated;
GRANT UPDATE (name, phone, contact_person, address, notes, active, updated_at) ON public.resellers TO authenticated;
COMMENT ON COLUMN public.resellers.price_p13 IS 'DEPRECATED (017): preço sigiloso em agregado_precos, só administrador';

-- 2. Retirada protegida: forma, preço, agregado e quantidade nunca mudam ---------------------------
CREATE OR REPLACE FUNCTION public._agregado_guard_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_method = 'agregado' AND coalesce(current_setting('g1.agregado',true),'') <> 'on' THEN
      RAISE EXCEPTION 'Retirada de agregado só pela ação de retirada da portaria' USING ERRCODE='42501'; END IF;
    RETURN NEW;
  END IF;
  IF (OLD.payment_method = 'agregado' OR NEW.payment_method = 'agregado') AND (
       NEW.payment_method IS DISTINCT FROM OLD.payment_method OR NEW.price IS DISTINCT FROM OLD.price
    OR NEW.reseller_id IS DISTINCT FROM OLD.reseller_id OR NEW.quantity IS DISTINCT FROM OLD.quantity
    OR NEW.product IS DISTINCT FROM OLD.product OR NEW.organization_id IS DISTINCT FROM OLD.organization_id) THEN
    RAISE EXCEPTION 'Retirada de agregado não muda forma, preço, agregado, produto ou quantidade: valor só no acerto do administrador e devolução pela reversão' USING ERRCODE='42501';
  END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS orders_agregado_guard ON public.orders;
CREATE TRIGGER orders_agregado_guard BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public._agregado_guard_order();

-- conta antiga de botijões: lançamentos de agregado ficam só como histórico (sem novos, sem preço)
CREATE OR REPLACE FUNCTION public._conta_botijoes_agregado_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.parceiro_tipo = 'agregado' OR (TG_OP = 'UPDATE' AND OLD.parceiro_tipo = 'agregado') THEN
    RAISE EXCEPTION 'A conta do agregado agora é registrada pela retirada da portaria e pelo acerto do administrador' USING ERRCODE='42501'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS conta_botijoes_agregado_guard ON public.conta_botijoes;
CREATE TRIGGER conta_botijoes_agregado_guard BEFORE INSERT OR UPDATE ON public.conta_botijoes FOR EACH ROW EXECUTE FUNCTION public._conta_botijoes_agregado_guard();

-- 3. Acertos e lançamentos financeiros (só administrador) -------------------------------------------
CREATE TABLE IF NOT EXISTS public.agregado_acertos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  reseller_id uuid NOT NULL REFERENCES public.resellers(id),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  observacoes text,
  data_operacao date NOT NULL,
  criado_por uuid NOT NULL,
  criado_por_nome text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.agregado_acerto_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  acerto_id uuid NOT NULL REFERENCES public.agregado_acertos(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  quantidade integer NOT NULL CHECK (quantidade > 0),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (acerto_id, order_id)
);
CREATE INDEX IF NOT EXISTS agregado_acerto_itens_order ON public.agregado_acerto_itens(order_id);
CREATE TABLE IF NOT EXISTS public.agregado_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  reseller_id uuid NOT NULL REFERENCES public.resellers(id),
  tipo text NOT NULL CHECK (tipo IN ('por_conta','pagamento','uso_credito','ajuste','credito_ajuste','devolucao_credito')),
  valor numeric(12,2) NOT NULL CHECK (valor <> 0 AND (tipo = 'ajuste' OR valor > 0)),
  forma text CHECK (forma IS NULL OR forma IN ('dinheiro','pix','cartao')),
  destino text CHECK (destino IS NULL OR destino IN ('caixa','conta_empresa')),
  acerto_id uuid REFERENCES public.agregado_acertos(id),
  credito_id uuid REFERENCES public.agregado_lancamentos(id),
  order_id uuid REFERENCES public.orders(id),
  reversao_id uuid REFERENCES public.reversoes(id),
  recebido_em timestamptz NOT NULL DEFAULT now(),
  data_operacao date NOT NULL,
  observacoes text,
  anulado_em timestamptz,
  anulado_por uuid,
  anulado_motivo text,
  registrado_por uuid NOT NULL,
  registrado_por_nome text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CHECK ((tipo IN ('por_conta','pagamento','devolucao_credito')) = (forma IS NOT NULL AND destino IS NOT NULL)),
  CHECK (tipo NOT IN ('pagamento','uso_credito','ajuste','credito_ajuste') OR acerto_id IS NOT NULL),
  CHECK ((tipo IN ('uso_credito','devolucao_credito')) = (credito_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS agregado_lancamentos_reseller ON public.agregado_lancamentos(reseller_id);
CREATE INDEX IF NOT EXISTS agregado_lancamentos_acerto ON public.agregado_lancamentos(acerto_id);
CREATE INDEX IF NOT EXISTS agregado_lancamentos_credito ON public.agregado_lancamentos(credito_id);

GRANT SELECT ON public.agregado_acertos, public.agregado_acerto_itens, public.agregado_lancamentos TO authenticated;
GRANT ALL ON public.agregado_acertos, public.agregado_acerto_itens, public.agregado_lancamentos TO service_role;
ALTER TABLE public.agregado_acertos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agregado_acerto_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agregado_lancamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "g1 admin le acertos" ON public.agregado_acertos;
CREATE POLICY "g1 admin le acertos" ON public.agregado_acertos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_admin());
DROP POLICY IF EXISTS "g1 admin le lancamentos" ON public.agregado_lancamentos;
CREATE POLICY "g1 admin le lancamentos" ON public.agregado_lancamentos FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_admin());
-- itens só têm quantidades (sem valor): operador vê o que já foi acertado
DROP POLICY IF EXISTS "g1 operador le itens acerto" ON public.agregado_acerto_itens;
CREATE POLICY "g1 operador le itens acerto" ON public.agregado_acerto_itens FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org() AND public.is_operador());

-- 4. Funções internas ---------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._agregado_travar(_reseller uuid) RETURNS void LANGUAGE sql AS
$$ SELECT pg_advisory_xact_lock(hashtextextended('g1.agregado|' || _reseller, 0)) $$;

CREATE OR REPLACE FUNCTION public._agregado_forma(_f text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE public._forma_pedido(_f) WHEN 'money' THEN 'dinheiro' WHEN 'pix' THEN 'pix'
    WHEN 'credit' THEN 'cartao' WHEN 'debit' THEN 'cartao' END $$;

CREATE OR REPLACE FUNCTION public._agregado_credito_saldo(_credito uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT l.valor - coalesce((SELECT sum(u.valor) FROM public.agregado_lancamentos u
           WHERE u.credito_id = l.id AND u.tipo IN ('uso_credito','devolucao_credito') AND u.anulado_em IS NULL), 0)
    FROM public.agregado_lancamentos l
   WHERE l.id = _credito AND l.tipo IN ('por_conta','credito_ajuste') AND l.anulado_em IS NULL $$;

CREATE OR REPLACE FUNCTION public._agregado_acerto_saldo(_acerto uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.valor + coalesce((SELECT sum(CASE l.tipo WHEN 'ajuste' THEN l.valor WHEN 'credito_ajuste' THEN l.valor ELSE -l.valor END)
           FROM public.agregado_lancamentos l WHERE l.acerto_id = a.id AND l.anulado_em IS NULL
            AND l.tipo IN ('ajuste','credito_ajuste','uso_credito','pagamento')), 0)
    FROM public.agregado_acertos a WHERE a.id = _acerto $$;

-- quantidades de uma retirada: acertada, devolvida (confirmada) e pendente
CREATE OR REPLACE FUNCTION public._agregado_qtd(_order uuid, OUT quantidade integer, OUT acertada integer, OUT devolvida integer,
  OUT em_devolucao boolean, OUT pendente integer) RETURNS record LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT o.quantity,
    coalesce((SELECT sum(i.quantidade) FROM public.agregado_acerto_itens i WHERE i.order_id = o.id), 0)::int,
    coalesce((SELECT sum(CASE WHEN o.tipo_venda = 'vasilhame' THEN v.confirmado_vazios_recolher ELSE v.confirmado_cheios END)
       FROM public.reversoes v WHERE v.order_id = o.id AND v.tipo IN ('devolucao','duplicidade') AND v.status <> 'recusada'), 0)::int,
    EXISTS (SELECT 1 FROM public.reversoes v WHERE v.order_id = o.id AND v.tipo IN ('devolucao','duplicidade') AND v.status <> 'recusada'),
    CASE WHEN EXISTS (SELECT 1 FROM public.reversoes v WHERE v.order_id = o.id AND v.tipo IN ('devolucao','duplicidade') AND v.status <> 'recusada')
      THEN 0
      ELSE greatest(o.quantity - coalesce((SELECT sum(i.quantidade) FROM public.agregado_acerto_itens i WHERE i.order_id = o.id), 0), 0) END::int
  FROM public.orders o WHERE o.id = _order $$;

-- uso de crédito e dinheiro novo num acerto (explícitos; nunca automático)
CREATE OR REPLACE FUNCTION public._agregado_pagar(_acerto uuid, _creditos jsonb, _pagamento numeric, _forma text, _obs text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a public.agregado_acertos%ROWTYPE; c record; cr public.agregado_lancamentos%ROWTYPE; saldo numeric; usado numeric := 0;
  f text; hoje date := public.data_operacional(); BEGIN
  SELECT * INTO a FROM public.agregado_acertos WHERE id = _acerto FOR UPDATE;
  saldo := public._agregado_acerto_saldo(_acerto);
  IF _creditos IS NOT NULL AND jsonb_typeof(_creditos) <> 'array' THEN RAISE EXCEPTION 'Créditos inválidos'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(coalesce(_creditos,'[]'::jsonb)) e) <>
     (SELECT count(DISTINCT e->>'id') FROM jsonb_array_elements(coalesce(_creditos,'[]'::jsonb)) e) THEN
    RAISE EXCEPTION 'O mesmo crédito foi informado duas vezes'; END IF;
  FOR c IN SELECT (e->>'id')::uuid AS id, round((e->>'valor')::numeric, 2) AS valor FROM jsonb_array_elements(coalesce(_creditos,'[]'::jsonb)) e LOOP
    IF c.valor IS NULL OR c.valor <= 0 THEN RAISE EXCEPTION 'Valor de crédito inválido'; END IF;
    SELECT * INTO cr FROM public.agregado_lancamentos WHERE id = c.id FOR UPDATE;
    IF cr.id IS NULL OR cr.organization_id <> a.organization_id OR cr.reseller_id <> a.reseller_id
       OR cr.tipo NOT IN ('por_conta','credito_ajuste') OR cr.anulado_em IS NOT NULL THEN
      RAISE EXCEPTION 'Crédito não encontrado para este agregado'; END IF;
    IF public._agregado_credito_saldo(c.id) < c.valor THEN
      RAISE EXCEPTION 'Crédito insuficiente: disponível R$ %, solicitado R$ %', public._agregado_credito_saldo(c.id), c.valor; END IF;
    INSERT INTO public.agregado_lancamentos(organization_id, reseller_id, tipo, valor, acerto_id, credito_id, data_operacao, observacoes, registrado_por, registrado_por_nome)
      VALUES (a.organization_id, a.reseller_id, 'uso_credito', c.valor, a.id, c.id, hoje, _obs, auth.uid(), public._meu_nome());
    usado := usado + c.valor;
  END LOOP;
  IF _pagamento IS NOT NULL AND _pagamento < 0 THEN RAISE EXCEPTION 'Valor recebido inválido'; END IF;
  IF coalesce(_pagamento,0) > 0 THEN
    f := public._agregado_forma(_forma);
    IF f IS NULL THEN RAISE EXCEPTION 'Informe a forma real do recebimento (Dinheiro, PIX, Crédito ou Débito)'; END IF;
    INSERT INTO public.agregado_lancamentos(organization_id, reseller_id, tipo, valor, forma, destino, acerto_id, data_operacao, observacoes, registrado_por, registrado_por_nome)
      VALUES (a.organization_id, a.reseller_id, 'pagamento', round(_pagamento,2), f, CASE WHEN f = 'dinheiro' THEN 'caixa' ELSE 'conta_empresa' END,
              a.id, hoje, _obs, auth.uid(), public._meu_nome());
  END IF;
  IF usado + coalesce(round(_pagamento,2),0) > saldo THEN
    RAISE EXCEPTION 'Crédito + dinheiro (R$ %) passam do valor devido (R$ %). Registre a sobra como por conta', usado + coalesce(round(_pagamento,2),0), saldo; END IF;
END $$;

-- 5. Ações -------------------------------------------------------------------------------------------
-- Retirada pela portaria: pedido + saída do estoque + conta quantitativa, numa transação; sem preço.
CREATE OR REPLACE FUNCTION public.retirada_agregado(_reseller_id uuid, _produto text, _quantidade integer, _tipo_venda text,
  _vasilhames_recebidos integer, _comodato boolean, _observacoes text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); oid uuid; prev uuid; k text := public._produto_chave(_produto);
  t text := public._tipo_venda_chave(coalesce(_tipo_venda,'recarga')); com boolean := coalesce(_comodato,false);
  vaz integer; emp integer; h text; nome text; antes text := coalesce(current_setting('g1.acao_controlada',true),''); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Retirada exige chave de reenvio'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto sem controle de estoque: %', _produto; END IF;
  IF t IS NULL THEN RAISE EXCEPTION 'Tipo de venda inválido: %', _tipo_venda; END IF;
  IF _vasilhames_recebidos IS NOT NULL AND _vasilhames_recebidos < 0 THEN RAISE EXCEPTION 'Vasilhames recebidos inválidos'; END IF;
  SELECT name INTO nome FROM public.resellers WHERE id = _reseller_id AND organization_id = o AND active;
  IF nome IS NULL THEN RAISE EXCEPTION 'Agregado não encontrado nesta empresa'; END IF;
  vaz := CASE WHEN t = 'vasilhame' OR com THEN 0 ELSE coalesce(_vasilhames_recebidos, CASE WHEN t = 'recarga' THEN _quantidade ELSE 0 END) END;
  emp := CASE WHEN com AND t <> 'vasilhame' THEN _quantidade ELSE 0 END;
  h := md5(concat_ws('|', _reseller_id::text, k, _quantidade::text, t, vaz::text, emp::text, coalesce(btrim(_observacoes),'')));
  prev := public._reenvio(o, _chave, 'retirada_agregado', h); IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM set_config('g1.acao_controlada','on',true);
  PERFORM set_config('g1.agregado','on',true);
  INSERT INTO public.orders(user_id, organization_id, client_id, reseller_id, client_name, address, product, quantity, price, payment_method,
    status, delivered_at, origem_venda, tipo_venda, has_empty_cylinder, vasilhames_entregues, vasilhames_recebidos, notes)
  VALUES (auth.uid(), o, NULL, _reseller_id, nome, '{}'::jsonb, _produto, _quantidade, NULL, 'agregado',
    'delivered', now(), 'portaria', t, NOT com,
    CASE WHEN t IN ('vasilhame','completa') THEN _quantidade ELSE 0 END, vaz,
    concat_ws(' | ', 'Retirada de agregado — a acertar', nullif(btrim(coalesce(_observacoes,'')),'')))
  RETURNING id INTO oid;
  PERFORM set_config('g1.agregado','off',true);
  PERFORM public.registrar_movimentacao_portaria(CASE WHEN com THEN 'venda_comodato' ELSE 'venda' END, k,
    CASE WHEN t = 'vasilhame' THEN 0 ELSE -_quantidade END,
    CASE WHEN t = 'vasilhame' THEN -_quantidade ELSE vaz END,
    emp, NULL, nome, oid, 'Retirada de agregado — a acertar');
  PERFORM public._reenvio_fim(o, _chave, oid);
  PERFORM set_config('g1.acao_controlada',antes,true);
  RETURN oid; END $$;

-- Conta quantitativa (operador e administrador): só quantidades, nunca valores.
CREATE OR REPLACE FUNCTION public.agregado_conta(_reseller_id uuid)
RETURNS TABLE(order_id uuid, criado_em timestamptz, produto text, tipo_venda text, quantidade integer, acertada integer,
  devolvida integer, em_devolucao boolean, pendente integer, status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT x.id, coalesce(x.delivered_at, x.created_at), x.product, x.tipo_venda, q.quantidade, q.acertada, q.devolvida, q.em_devolucao, q.pendente, x.status
    FROM public.orders x CROSS JOIN LATERAL public._agregado_qtd(x.id) q
   WHERE x.organization_id = o AND x.reseller_id = _reseller_id AND x.payment_method = 'agregado' AND x.status <> 'cancelled'
   ORDER BY coalesce(x.delivered_at, x.created_at) DESC;
END $$;

CREATE OR REPLACE FUNCTION public.agregado_preco_definir(_reseller_id uuid, _produto text, _preco numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); k text := public._produto_chave(_produto); BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador define preço de agregado' USING ERRCODE='42501'; END IF;
  IF k IS NULL THEN RAISE EXCEPTION 'Produto inválido: %', _produto; END IF;
  IF _preco IS NULL OR _preco <= 0 THEN RAISE EXCEPTION 'Informe um preço maior que zero'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.resellers WHERE id = _reseller_id AND organization_id = o) THEN
    RAISE EXCEPTION 'Agregado não encontrado nesta empresa'; END IF;
  INSERT INTO public.agregado_precos(reseller_id, produto, organization_id, preco, atualizado_por, atualizado_em)
    VALUES (_reseller_id, k, o, round(_preco,2), auth.uid(), now())
    ON CONFLICT (reseller_id, produto) DO UPDATE SET preco = EXCLUDED.preco, atualizado_por = EXCLUDED.atualizado_por, atualizado_em = now();
END $$;

CREATE OR REPLACE FUNCTION public.agregado_por_conta_registrar(_reseller_id uuid, _valor numeric, _forma text, _recebido_em timestamptz,
  _observacoes text, _chave text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; f text := public._agregado_forma(_forma); rid uuid; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador registra por conta' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Por conta exige chave de reenvio'; END IF;
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe um valor maior que zero'; END IF;
  IF f IS NULL THEN RAISE EXCEPTION 'Informe a forma real do recebimento (Dinheiro, PIX, Crédito ou Débito)'; END IF;
  IF _recebido_em IS NOT NULL AND _recebido_em > now() + interval '5 minutes' THEN RAISE EXCEPTION 'Data/hora do recebimento no futuro'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.resellers WHERE id = _reseller_id AND organization_id = o) THEN
    RAISE EXCEPTION 'Agregado não encontrado nesta empresa'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_por_conta', md5(concat_ws('|', _reseller_id::text, round(_valor,2)::text, f,
            coalesce(_recebido_em::text,''), coalesce(btrim(_observacoes),''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  INSERT INTO public.agregado_lancamentos(organization_id, reseller_id, tipo, valor, forma, destino, recebido_em, data_operacao, observacoes, registrado_por, registrado_por_nome)
    VALUES (o, _reseller_id, 'por_conta', round(_valor,2), f, CASE WHEN f = 'dinheiro' THEN 'caixa' ELSE 'conta_empresa' END,
            coalesce(_recebido_em, now()), public.data_operacional(), nullif(btrim(coalesce(_observacoes,'')),''), auth.uid(), public._meu_nome())
    RETURNING id INTO rid;
  PERFORM public._reenvio_fim(o, _chave, rid);
  RETURN rid; END $$;

CREATE OR REPLACE FUNCTION public.agregado_acerto_registrar(_reseller_id uuid, _itens jsonb, _valor numeric, _creditos jsonb,
  _pagamento numeric, _forma text, _observacoes text, _chave text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; aid uuid; it record; ord public.orders%ROWTYPE; q record; n integer := 0; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador faz acerto' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Acerto exige chave de reenvio'; END IF;
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe o valor combinado do acerto'; END IF;
  IF _itens IS NULL OR jsonb_typeof(_itens) <> 'array' OR jsonb_array_length(_itens) = 0 THEN RAISE EXCEPTION 'Selecione as retiradas do acerto'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(_itens) e) <> (SELECT count(DISTINCT e->>'order_id') FROM jsonb_array_elements(_itens) e) THEN
    RAISE EXCEPTION 'A mesma retirada foi informada duas vezes'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.resellers WHERE id = _reseller_id AND organization_id = o) THEN
    RAISE EXCEPTION 'Agregado não encontrado nesta empresa'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_acerto', md5(concat_ws('|', _reseller_id::text, _itens::text, round(_valor,2)::text,
            coalesce(_creditos::text,''), coalesce(round(_pagamento,2)::text,''), coalesce(public._agregado_forma(_forma),''), coalesce(btrim(_observacoes),''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM public._agregado_travar(_reseller_id);
  INSERT INTO public.agregado_acertos(organization_id, reseller_id, valor, observacoes, data_operacao, criado_por, criado_por_nome)
    VALUES (o, _reseller_id, round(_valor,2), nullif(btrim(coalesce(_observacoes,'')),''), public.data_operacional(), auth.uid(), public._meu_nome())
    RETURNING id INTO aid;
  FOR it IN SELECT (e->>'order_id')::uuid AS order_id, (e->>'quantidade')::int AS qtd FROM jsonb_array_elements(_itens) e ORDER BY 1 LOOP
    SELECT * INTO ord FROM public.orders WHERE id = it.order_id AND organization_id = o FOR UPDATE;
    IF ord.id IS NULL OR ord.reseller_id IS DISTINCT FROM _reseller_id OR ord.payment_method IS DISTINCT FROM 'agregado' THEN
      RAISE EXCEPTION 'Retirada não pertence a este agregado'; END IF;
    IF ord.status NOT IN ('completed','delivered') THEN RAISE EXCEPTION 'Retirada não concluída (situação: %)', ord.status; END IF;
    SELECT * INTO q FROM public._agregado_qtd(ord.id);
    IF q.em_devolucao THEN RAISE EXCEPTION 'Retirada com devolução registrada não entra em acerto'; END IF;
    IF it.qtd IS NULL OR it.qtd <= 0 OR it.qtd > q.pendente THEN
      RAISE EXCEPTION 'Quantidade inválida para a retirada %: ainda não acertadas %, solicitadas %', left(ord.id::text,8), q.pendente, coalesce(it.qtd,0); END IF;
    INSERT INTO public.agregado_acerto_itens(organization_id, acerto_id, order_id, quantidade) VALUES (o, aid, ord.id, it.qtd);
    n := n + 1;
  END LOOP;
  PERFORM public._agregado_pagar(aid, _creditos, _pagamento, _forma, 'No acerto');
  PERFORM public._reenvio_fim(o, _chave, aid);
  RETURN aid; END $$;

CREATE OR REPLACE FUNCTION public.agregado_acerto_pagar(_acerto_id uuid, _creditos jsonb, _pagamento numeric, _forma text, _observacoes text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; a public.agregado_acertos%ROWTYPE; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador recebe acerto' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Pagamento exige chave de reenvio'; END IF;
  SELECT * INTO a FROM public.agregado_acertos WHERE id = _acerto_id AND organization_id = o;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Acerto não encontrado'; END IF;
  IF coalesce(_pagamento,0) <= 0 AND coalesce(jsonb_array_length(CASE WHEN jsonb_typeof(_creditos) = 'array' THEN _creditos END),0) = 0 THEN
    RAISE EXCEPTION 'Informe o crédito a utilizar ou o dinheiro recebido'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_acerto_pagar', md5(concat_ws('|', _acerto_id::text, coalesce(_creditos::text,''),
            coalesce(round(_pagamento,2)::text,''), coalesce(public._agregado_forma(_forma),''), coalesce(btrim(_observacoes),''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM public._agregado_travar(a.reseller_id);
  PERFORM public._agregado_pagar(a.id, _creditos, _pagamento, _forma, nullif(btrim(coalesce(_observacoes,'')),''));
  PERFORM public._reenvio_fim(o, _chave, a.id);
  RETURN a.id; END $$;

-- Ajuste administrativo de um acerto (não movimenta estoque; nunca apaga o acerto)
CREATE OR REPLACE FUNCTION public._agregado_ajustar(_acerto uuid, _valor numeric, _motivo text, _order uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a public.agregado_acertos%ROWTYPE; s numeric; aj numeric; BEGIN
  SELECT * INTO a FROM public.agregado_acertos WHERE id = _acerto FOR UPDATE;
  IF _valor IS NULL OR round(_valor,2) = 0 THEN RAISE EXCEPTION 'Informe o valor do ajuste'; END IF;
  IF coalesce(length(btrim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 letras)'; END IF;
  IF _order IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.agregado_acerto_itens WHERE acerto_id = a.id AND order_id = _order) THEN
    RAISE EXCEPTION 'Retirada não pertence a este acerto'; END IF;
  aj := a.valor + coalesce((SELECT sum(valor) FROM public.agregado_lancamentos WHERE acerto_id = a.id AND tipo = 'ajuste' AND anulado_em IS NULL),0) + round(_valor,2);
  IF aj < 0 THEN RAISE EXCEPTION 'O ajuste deixaria o acerto com valor negativo'; END IF;
  INSERT INTO public.agregado_lancamentos(organization_id, reseller_id, tipo, valor, acerto_id, order_id, data_operacao, observacoes, registrado_por, registrado_por_nome)
    VALUES (a.organization_id, a.reseller_id, 'ajuste', round(_valor,2), a.id, _order, public.data_operacional(), btrim(_motivo), auth.uid(), public._meu_nome());
  s := public._agregado_acerto_saldo(a.id);
  IF s < 0 THEN -- já pago além do novo valor: a sobra vira crédito disponível (sem entrar dinheiro de novo)
    INSERT INTO public.agregado_lancamentos(organization_id, reseller_id, tipo, valor, acerto_id, data_operacao, observacoes, registrado_por, registrado_por_nome)
      VALUES (a.organization_id, a.reseller_id, 'credito_ajuste', -s, a.id, public.data_operacional(), 'Sobra do acerto após ajuste: ' || btrim(_motivo), auth.uid(), public._meu_nome());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.agregado_acerto_ajustar(_acerto_id uuid, _valor numeric, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; a public.agregado_acertos%ROWTYPE; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador ajusta acerto' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Ajuste exige chave de reenvio'; END IF;
  SELECT * INTO a FROM public.agregado_acertos WHERE id = _acerto_id AND organization_id = o;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Acerto não encontrado'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_acerto_ajustar', md5(concat_ws('|', _acerto_id::text, round(coalesce(_valor,0),2)::text, coalesce(btrim(_motivo),''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM public._agregado_travar(a.reseller_id);
  PERFORM public._agregado_ajustar(a.id, _valor, _motivo, NULL);
  PERFORM public._reenvio_fim(o, _chave, a.id);
  RETURN a.id; END $$;

-- Devolução de retirada já acertada: ajuste vinculado ao acerto + reversão (estoque só com retorno físico confirmado)
CREATE OR REPLACE FUNCTION public.agregado_devolucao_acertada(_order_id uuid, _acerto_id uuid, _valor_ajuste numeric, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; a public.agregado_acertos%ROWTYPE; rid uuid; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador ajusta acerto' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Devolução exige chave de reenvio'; END IF;
  SELECT * INTO a FROM public.agregado_acertos WHERE id = _acerto_id AND organization_id = o;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Acerto não encontrado'; END IF;
  IF _valor_ajuste IS NULL OR _valor_ajuste <= 0 THEN RAISE EXCEPTION 'Informe quanto o acerto diminui com a devolução'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_devolucao_acertada', md5(concat_ws('|', _order_id::text, _acerto_id::text, round(_valor_ajuste,2)::text, coalesce(btrim(_motivo),''))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM public._agregado_travar(a.reseller_id);
  PERFORM public._agregado_ajustar(a.id, -_valor_ajuste, 'Devolução após acerto: ' || coalesce(btrim(_motivo),''), _order_id);
  PERFORM set_config('g1.agregado_ajuste','on',true);
  rid := public.reversao_solicitar(_order_id, 'devolucao', _motivo, NULL, NULL, true, _chave || ':rev');
  PERFORM set_config('g1.agregado_ajuste','off',true);
  UPDATE public.agregado_lancamentos SET reversao_id = rid
   WHERE id = (SELECT id FROM public.agregado_lancamentos WHERE acerto_id = a.id AND tipo = 'ajuste' AND order_id = _order_id ORDER BY criado_em DESC LIMIT 1);
  PERFORM public._reenvio_fim(o, _chave, rid);
  RETURN rid; END $$;

-- Devolução de crédito: registra o dinheiro efetivamente devolvido (não faz transferência)
CREATE OR REPLACE FUNCTION public.agregado_credito_devolver(_credito_id uuid, _valor numeric, _forma text, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; cr public.agregado_lancamentos%ROWTYPE; f text := public._agregado_forma(_forma); rid uuid; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador autoriza devolução de crédito' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Devolução exige chave de reenvio'; END IF;
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Informe o valor devolvido'; END IF;
  IF f IS NULL THEN RAISE EXCEPTION 'Informe como o dinheiro foi devolvido (Dinheiro, PIX, Crédito ou Débito)'; END IF;
  IF coalesce(length(btrim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 letras)'; END IF;
  SELECT * INTO cr FROM public.agregado_lancamentos WHERE id = _credito_id AND organization_id = o;
  IF cr.id IS NULL OR cr.tipo NOT IN ('por_conta','credito_ajuste') THEN RAISE EXCEPTION 'Crédito não encontrado'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_credito_devolver', md5(concat_ws('|', _credito_id::text, round(_valor,2)::text, f, btrim(_motivo))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM public._agregado_travar(cr.reseller_id);
  PERFORM 1 FROM public.agregado_lancamentos WHERE id = cr.id FOR UPDATE;
  IF public._agregado_credito_saldo(cr.id) < round(_valor,2) THEN
    RAISE EXCEPTION 'Crédito insuficiente: disponível R$ %', coalesce(public._agregado_credito_saldo(cr.id),0); END IF;
  INSERT INTO public.agregado_lancamentos(organization_id, reseller_id, tipo, valor, forma, destino, credito_id, data_operacao, observacoes, registrado_por, registrado_por_nome)
    VALUES (o, cr.reseller_id, 'devolucao_credito', round(_valor,2), f, CASE WHEN f = 'dinheiro' THEN 'caixa' ELSE 'conta_empresa' END,
            cr.id, public.data_operacional(), btrim(_motivo), auth.uid(), public._meu_nome()) RETURNING id INTO rid;
  PERFORM public._reenvio_fim(o, _chave, rid);
  RETURN rid; END $$;

-- Anular por conta lançado por engano: só se nada dele foi usado ou devolvido
CREATE OR REPLACE FUNCTION public.agregado_por_conta_anular(_id uuid, _motivo text, _chave text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); prev uuid; cr public.agregado_lancamentos%ROWTYPE; BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Só o administrador anula por conta' USING ERRCODE='42501'; END IF;
  IF _chave IS NULL THEN RAISE EXCEPTION 'Anulação exige chave de reenvio'; END IF;
  IF coalesce(length(btrim(_motivo)),0) < 5 THEN RAISE EXCEPTION 'Motivo obrigatório (mínimo 5 letras)'; END IF;
  SELECT * INTO cr FROM public.agregado_lancamentos WHERE id = _id AND organization_id = o AND tipo = 'por_conta';
  IF cr.id IS NULL THEN RAISE EXCEPTION 'Por conta não encontrado'; END IF;
  prev := public._reenvio(o, _chave, 'agregado_por_conta_anular', md5(concat_ws('|', _id::text, btrim(_motivo))));
  IF prev IS NOT NULL THEN RETURN prev; END IF;
  PERFORM public._agregado_travar(cr.reseller_id);
  SELECT * INTO cr FROM public.agregado_lancamentos WHERE id = _id FOR UPDATE;
  IF cr.anulado_em IS NOT NULL THEN RAISE EXCEPTION 'Por conta já anulado'; END IF;
  IF EXISTS (SELECT 1 FROM public.agregado_lancamentos WHERE credito_id = cr.id AND anulado_em IS NULL) THEN
    RAISE EXCEPTION 'Por conta já utilizado ou devolvido não pode ser anulado: a quitação ficaria sem dinheiro. Use ajuste do acerto'; END IF;
  UPDATE public.agregado_lancamentos SET anulado_em = now(), anulado_por = auth.uid(), anulado_motivo = btrim(_motivo) WHERE id = cr.id;
  PERFORM public._reenvio_fim(o, _chave, cr.id);
  RETURN cr.id; END $$;

-- Resumo financeiro (só administrador): acertos com saldo, créditos e lançamentos
CREATE OR REPLACE FUNCTION public.agregado_financeiro(_reseller_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'precos', coalesce((SELECT jsonb_object_agg(produto, preco) FROM public.agregado_precos WHERE reseller_id = _reseller_id AND organization_id = o), '{}'::jsonb),
    'acertos', coalesce((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'data', a.data_operacao, 'criado_em', a.criado_em, 'valor', a.valor,
        'ajustes', coalesce((SELECT sum(valor) FROM public.agregado_lancamentos WHERE acerto_id = a.id AND tipo = 'ajuste' AND anulado_em IS NULL),0),
        'credito_usado', coalesce((SELECT sum(valor) FROM public.agregado_lancamentos WHERE acerto_id = a.id AND tipo = 'uso_credito' AND anulado_em IS NULL),0),
        'recebido', coalesce((SELECT sum(valor) FROM public.agregado_lancamentos WHERE acerto_id = a.id AND tipo = 'pagamento' AND anulado_em IS NULL),0),
        'sobra_credito', coalesce((SELECT sum(valor) FROM public.agregado_lancamentos WHERE acerto_id = a.id AND tipo = 'credito_ajuste' AND anulado_em IS NULL),0),
        'saldo', public._agregado_acerto_saldo(a.id), 'observacoes', a.observacoes, 'criado_por', a.criado_por_nome,
        'itens', (SELECT jsonb_agg(jsonb_build_object('order_id', i.order_id, 'quantidade', i.quantidade, 'produto', x.product)) FROM public.agregado_acerto_itens i JOIN public.orders x ON x.id = i.order_id WHERE i.acerto_id = a.id))
        ORDER BY a.criado_em DESC) FROM public.agregado_acertos a WHERE a.reseller_id = _reseller_id AND a.organization_id = o), '[]'::jsonb),
    'creditos', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'tipo', l.tipo, 'data', l.data_operacao, 'recebido_em', l.recebido_em,
        'valor', l.valor, 'forma', l.forma, 'saldo', coalesce(public._agregado_credito_saldo(l.id),0), 'anulado', l.anulado_em IS NOT NULL, 'observacoes', l.observacoes)
        ORDER BY l.recebido_em) FROM public.agregado_lancamentos l WHERE l.reseller_id = _reseller_id AND l.organization_id = o AND l.tipo IN ('por_conta','credito_ajuste')), '[]'::jsonb),
    'lancamentos', coalesce((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'tipo', l.tipo, 'valor', l.valor, 'forma', l.forma, 'destino', l.destino,
        'acerto_id', l.acerto_id, 'credito_id', l.credito_id, 'order_id', l.order_id, 'data', l.data_operacao, 'recebido_em', l.recebido_em,
        'observacoes', l.observacoes, 'anulado_em', l.anulado_em, 'anulado_motivo', l.anulado_motivo, 'registrado_por', l.registrado_por_nome)
        ORDER BY l.criado_em) FROM public.agregado_lancamentos l WHERE l.reseller_id = _reseller_id AND l.organization_id = o), '[]'::jsonb)
  );
END $$;

-- 6. Reversão de retirada já acertada só com ajuste vinculado ----------------------------------------
CREATE OR REPLACE FUNCTION public._agregado_guard_reversao() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.tipo IN ('devolucao','duplicidade') AND EXISTS (SELECT 1 FROM public.agregado_acerto_itens WHERE order_id = NEW.order_id)
     AND coalesce(current_setting('g1.agregado_ajuste',true),'') <> 'on' THEN
    RAISE EXCEPTION 'Retirada de agregado já acertada: a devolução exige ajuste administrativo vinculado ao acerto (ficha do agregado, administrador)'; END IF;
  RETURN NEW; END $$;
DROP TRIGGER IF EXISTS reversoes_agregado_guard ON public.reversoes;
CREATE TRIGGER reversoes_agregado_guard BEFORE INSERT ON public.reversoes FOR EACH ROW EXECUTE FUNCTION public._agregado_guard_reversao();

-- 7. Permissões das funções ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public._agregado_guard_order(), public._conta_botijoes_agregado_guard(), public._agregado_guard_reversao(),
  public._agregado_travar(uuid), public._agregado_forma(text), public._agregado_credito_saldo(uuid), public._agregado_acerto_saldo(uuid),
  public._agregado_qtd(uuid), public._agregado_pagar(uuid,jsonb,numeric,text,text), public._agregado_ajustar(uuid,numeric,text,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.retirada_agregado(uuid,text,integer,text,integer,boolean,text,text), public.agregado_conta(uuid),
  public.agregado_preco_definir(uuid,text,numeric), public.agregado_por_conta_registrar(uuid,numeric,text,timestamptz,text,text),
  public.agregado_acerto_registrar(uuid,jsonb,numeric,jsonb,numeric,text,text,text), public.agregado_acerto_pagar(uuid,jsonb,numeric,text,text,text),
  public.agregado_acerto_ajustar(uuid,numeric,text,text), public.agregado_devolucao_acertada(uuid,uuid,numeric,text,text),
  public.agregado_credito_devolver(uuid,numeric,text,text,text), public.agregado_por_conta_anular(uuid,text,text), public.agregado_financeiro(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retirada_agregado(uuid,text,integer,text,integer,boolean,text,text), public.agregado_conta(uuid),
  public.agregado_preco_definir(uuid,text,numeric), public.agregado_por_conta_registrar(uuid,numeric,text,timestamptz,text,text),
  public.agregado_acerto_registrar(uuid,jsonb,numeric,jsonb,numeric,text,text,text), public.agregado_acerto_pagar(uuid,jsonb,numeric,text,text,text),
  public.agregado_acerto_ajustar(uuid,numeric,text,text), public.agregado_devolucao_acertada(uuid,uuid,numeric,text,text),
  public.agregado_credito_devolver(uuid,numeric,text,text,text), public.agregado_por_conta_anular(uuid,text,text), public.agregado_financeiro(uuid)
  TO authenticated, service_role;