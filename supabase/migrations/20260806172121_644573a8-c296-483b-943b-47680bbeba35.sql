CREATE TABLE public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.get_my_org(),
  name text NOT NULL,
  phone text,
  contact_person text,
  address text,
  price_p13 numeric NOT NULL DEFAULT 0,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resellers TO authenticated;
GRANT ALL ON public.resellers TO service_role;

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage resellers"
ON public.resellers FOR ALL TO authenticated
USING (organization_id = public.get_my_org())
WITH CHECK (organization_id = public.get_my_org());

CREATE TRIGGER resellers_set_updated_at
BEFORE UPDATE ON public.resellers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_reseller_id_idx ON public.orders(reseller_id);