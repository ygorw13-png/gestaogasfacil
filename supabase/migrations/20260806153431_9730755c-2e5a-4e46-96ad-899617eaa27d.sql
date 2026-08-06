ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tipo_venda text NOT NULL DEFAULT 'completa',
  ADD COLUMN IF NOT EXISTS vasilhames_entregues integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vasilhames_recebidos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_id uuid;

CREATE TABLE IF NOT EXISTS public.entregador_localizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  nome text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entregador_localizacoes TO authenticated;
GRANT ALL ON public.entregador_localizacoes TO service_role;

ALTER TABLE public.entregador_localizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view locations"
  ON public.entregador_localizacoes FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org());

CREATE POLICY "entregador can insert own location"
  ON public.entregador_localizacoes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_my_org());

CREATE POLICY "entregador can update own location"
  ON public.entregador_localizacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER entregador_localizacoes_updated_at
  BEFORE UPDATE ON public.entregador_localizacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();