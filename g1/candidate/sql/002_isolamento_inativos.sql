-- G1 Etapa 2 — candidato (NÃO aplicar em produção sem revisão e aprovação explícita)
-- Escopo: isolamento entre empresas, bloqueio de contas inativas, sem fallback administrativo.
-- Não cria papéis novos, não muda o significado do papel 'user', não define matriz por função.
-- Pressupõe g0.1/sql/001_profile_verification.sql aplicado antes.

BEGIN;

-- 1) Conta inativa (ou sem perfil/empresa) não recebe empresa: todas as policies
--    "organization_id = get_my_org()" passam a recusar na hora, mesmo com token antigo.
CREATE OR REPLACE FUNCTION public.get_my_org()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT organization_id FROM public.profiles
   WHERE id = auth.uid() AND ativo IS TRUE AND organization_id IS NOT NULL
$$;

-- 2) Papel só vale para conta ativa. Sem perfil ativo = nenhum papel (sem fallback admin).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
      JOIN public.profiles p ON p.id = r.user_id
     WHERE r.user_id = _user_id AND r.role = _role AND p.ativo IS TRUE
  )
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND ativo IS TRUE
$$;

-- 3) Pedidos: somente da própria empresa. Remove o caminho "user_id = auth.uid()",
--    que permitia gravar pedido com organization_id de outra empresa.
DROP POLICY IF EXISTS "user owns or org orders" ON public.orders;
CREATE POLICY "org members access orders" ON public.orders
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- 4) dashboard_data: linhas 'system' eram legíveis/alteráveis por qualquer empresa.
DROP POLICY IF EXISTS "user reads own dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "user writes own dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "user updates own dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "user deletes own dashboard_data" ON public.dashboard_data;
CREATE POLICY "org reads dashboard_data" ON public.dashboard_data
  FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org());
CREATE POLICY "org writes own dashboard_data" ON public.dashboard_data
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_my_org() AND user_id = auth.uid()::text);
CREATE POLICY "org updates own dashboard_data" ON public.dashboard_data
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_my_org() AND user_id = auth.uid()::text)
  WITH CHECK (organization_id = public.get_my_org() AND user_id = auth.uid()::text);
CREATE POLICY "org deletes own dashboard_data" ON public.dashboard_data
  FOR DELETE TO authenticated
  USING (organization_id = public.get_my_org() AND user_id = auth.uid()::text);

-- 5) Localização do entregador: atualização não pode trocar a empresa nem valer para inativo.
DROP POLICY IF EXISTS "entregador can update own location" ON public.entregador_localizacoes;
CREATE POLICY "entregador can update own location" ON public.entregador_localizacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND organization_id = public.get_my_org())
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_my_org());

-- 6) Perfil próprio não pode ser criado já vinculado a uma empresa escolhida pelo usuário.
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'user' AND organization_id IS NULL);

-- 7) Movimentação da portaria: recusa explícita para conta inativa/sem empresa.
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_portaria(_tipo text, _produto text, _delta_cheios integer, _delta_vazios integer, _delta_emprestados integer, _cliente_id uuid DEFAULT NULL::uuid, _cliente_nome text DEFAULT NULL::text, _referencia_id uuid DEFAULT NULL::uuid, _observacoes text DEFAULT NULL::text, _data_operacao date DEFAULT CURRENT_DATE)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  _id UUID;
  _user_name TEXT;
  _org UUID := public.get_my_org();
BEGIN
  IF _org IS NULL THEN
    RAISE EXCEPTION 'Conta inativa ou sem empresa' USING ERRCODE = '42501';
  END IF;
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(
    organization_id, tipo, produto, delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes,
    registrado_por, registrado_por_nome, data_operacao
  ) VALUES (
    _org, _tipo, _produto, _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes,
    auth.uid(), _user_name, _data_operacao
  ) RETURNING id INTO _id;
  RETURN _id;
END;
$function$;

COMMIT;
