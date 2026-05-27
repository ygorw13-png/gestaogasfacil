
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_person TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Tighten dashboard_data policies to per-user instead of true
DROP POLICY IF EXISTS "auth read dashboard_data" ON public.dashboard_data;
DROP POLICY IF EXISTS "auth write dashboard_data" ON public.dashboard_data;
CREATE POLICY "user reads own dashboard_data" ON public.dashboard_data FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR user_id = 'system');
CREATE POLICY "user writes own dashboard_data" ON public.dashboard_data FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'system');
CREATE POLICY "user updates own dashboard_data" ON public.dashboard_data FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text OR user_id = 'system');
CREATE POLICY "user deletes own dashboard_data" ON public.dashboard_data FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);
