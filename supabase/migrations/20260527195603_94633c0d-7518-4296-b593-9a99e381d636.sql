
-- =========================
-- PROMISSORY NOTES
-- =========================
CREATE TABLE public.promissory_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  client_id UUID,
  client_name TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(12,2),
  payment_method TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promissory_notes TO authenticated;
GRANT ALL ON public.promissory_notes TO service_role;
ALTER TABLE public.promissory_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access promissory_notes" ON public.promissory_notes
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE TRIGGER trg_promissory_notes_updated
  BEFORE UPDATE ON public.promissory_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- VEHICLES
-- =========================
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  plate TEXT NOT NULL,
  model TEXT,
  brand TEXT,
  year INTEGER,
  type TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  current_km INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- VEHICLE ASSIGNMENTS
-- =========================
CREATE TABLE public.vehicle_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  vehicle_id UUID NOT NULL,
  driver_id UUID,
  driver_name TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_assignments TO authenticated;
GRANT ALL ON public.vehicle_assignments TO service_role;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access vehicle_assignments" ON public.vehicle_assignments
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- =========================
-- VEHICLE MAINTENANCES
-- =========================
CREATE TABLE public.vehicle_maintenances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  workshop TEXT,
  km INTEGER,
  status TEXT NOT NULL DEFAULT 'concluida',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_maintenances TO authenticated;
GRANT ALL ON public.vehicle_maintenances TO service_role;
ALTER TABLE public.vehicle_maintenances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access vehicle_maintenances" ON public.vehicle_maintenances
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- =========================
-- VEHICLE FUELS
-- =========================
CREATE TABLE public.vehicle_fuels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  vehicle_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters NUMERIC(10,3) NOT NULL DEFAULT 0,
  price_per_liter NUMERIC(10,3),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  km INTEGER,
  station TEXT,
  fuel_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_fuels TO authenticated;
GRANT ALL ON public.vehicle_fuels TO service_role;
ALTER TABLE public.vehicle_fuels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access vehicle_fuels" ON public.vehicle_fuels
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- =========================
-- VEHICLE EXPENSES
-- =========================
CREATE TABLE public.vehicle_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT public.get_my_org(),
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_expenses TO authenticated;
GRANT ALL ON public.vehicle_expenses TO service_role;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org access vehicle_expenses" ON public.vehicle_expenses
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org())
  WITH CHECK (organization_id = public.get_my_org());

-- Indexes
CREATE INDEX idx_promissory_notes_org_status ON public.promissory_notes(organization_id, status);
CREATE INDEX idx_vehicle_assignments_vehicle ON public.vehicle_assignments(vehicle_id);
CREATE INDEX idx_vehicle_maintenances_vehicle ON public.vehicle_maintenances(vehicle_id);
CREATE INDEX idx_vehicle_fuels_vehicle ON public.vehicle_fuels(vehicle_id);
CREATE INDEX idx_vehicle_expenses_vehicle ON public.vehicle_expenses(vehicle_id);
