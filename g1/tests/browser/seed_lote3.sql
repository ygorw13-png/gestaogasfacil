-- Dados fictícios do teste de navegador do lote 3 (banco descartável local).
SET session_replication_role = replica;
INSERT INTO public.orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,payment_method,address,created_at,origem_venda)
VALUES ('0d000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-00000000000b','0a000000-0000-4000-8000-000000000000',
 'Cliente Navegador Fictício','pending','recarga','Gás P13',125,1,'money','{}', now(), NULL)
ON CONFLICT DO NOTHING;
SET session_replication_role = origin;
