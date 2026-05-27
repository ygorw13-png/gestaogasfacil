
-- 1. Adicionar role 'entregador' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'entregador';

-- 2. Adicionar coluna valor_dinheiro em movimentacoes_portaria (pra registrar sangrias/entradas)
ALTER TABLE public.movimentacoes_portaria 
  ADD COLUMN IF NOT EXISTS valor_dinheiro NUMERIC DEFAULT 0;

-- 3. Tabela unificada de despesas
CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  tipo TEXT NOT NULL CHECK (tipo IN ('combustivel','manutencao','diversa','fixa')),
  veiculo_id TEXT,
  veiculo_placa TEXT,
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  origem_dinheiro TEXT NOT NULL CHECK (origem_dinheiro IN ('caixa_portaria','cofre','banco','pessoal')),
  caixa_movimentacao_id UUID REFERENCES public.movimentacoes_portaria(id) ON DELETE SET NULL,
  observacoes TEXT,
  registrado_por UUID NOT NULL DEFAULT auth.uid(),
  registrado_por_nome TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas TO authenticated;
GRANT ALL ON public.despesas TO service_role;

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org access despesas" ON public.despesas
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

CREATE TRIGGER update_despesas_updated_at
  BEFORE UPDATE ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Tabela push_subscriptions (para Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own push subs" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Tabela acertos_entregador
CREATE TABLE IF NOT EXISTS public.acertos_entregador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  entregador_id UUID NOT NULL,
  entregador_nome TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  total_dinheiro NUMERIC NOT NULL DEFAULT 0,
  total_pix NUMERIC NOT NULL DEFAULT 0,
  total_cartao NUMERIC NOT NULL DEFAULT 0,
  total_geral NUMERIC NOT NULL DEFAULT 0,
  qtd_entregas INT NOT NULL DEFAULT 0,
  qtd_vendas_rua INT NOT NULL DEFAULT 0,
  conferido_por UUID,
  conferido_em TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','conferido','divergente')),
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.acertos_entregador TO authenticated;
GRANT ALL ON public.acertos_entregador TO service_role;

ALTER TABLE public.acertos_entregador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org access acertos" ON public.acertos_entregador
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- 6. Adicionar coluna em orders para fluxo entregador
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS origem_venda TEXT DEFAULT 'portaria' CHECK (origem_venda IN ('portaria','rua','online'));

-- 7. Habilitar realtime para orders (entregador receber notificação)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- 8. Atualizar RLS de orders para entregador ver as suas
DROP POLICY IF EXISTS "user owns orders" ON public.orders;

CREATE POLICY "user owns or org orders" ON public.orders
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() 
    OR organization_id = public.get_my_org()
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR organization_id = public.get_my_org()
  );
