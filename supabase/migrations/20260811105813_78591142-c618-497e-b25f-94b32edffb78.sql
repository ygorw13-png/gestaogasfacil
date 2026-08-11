ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_origem_venda_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_origem_venda_check CHECK (origem_venda = ANY (ARRAY['portaria'::text,'rua'::text,'online'::text,'pedido'::text]));
UPDATE public.orders SET origem_venda = 'pedido'
WHERE origem_venda = 'portaria' AND address IS NOT NULL AND status IN ('pending','assigned','in-progress','delivering');