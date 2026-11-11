-- Dados fictícios do teste de navegador 010 (banco descartável local, depois do reset_com010.sh sem abertura).
SET session_replication_role = replica;
INSERT INTO public.orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,payment_method,address,created_at,origem_venda) VALUES
 ('0d000000-0000-4000-8000-000000010e01','a0000000-0000-4000-8000-00000000000b','0a000000-0000-4000-8000-000000000000','Cliente Entrega 010','pending','recarga','Gás P13',125,1,'money','{}',now(),NULL)
ON CONFLICT DO NOTHING;
SET session_replication_role = origin;
