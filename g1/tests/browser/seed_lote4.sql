-- Dados fictícios do teste de navegador do lote 4 (banco descartável local). Aplicar depois do seed_lote3.sql.
SET session_replication_role = replica;
INSERT INTO auth.users(id,email) VALUES ('a0000000-0000-4000-8000-00000000000f','entregador2.a@ficticio.test') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles(id,name,role,organization_id,ativo) VALUES
 ('a0000000-0000-4000-8000-00000000000f','Entregador Dois A','entregador','0a000000-0000-4000-8000-000000000000',true) ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id,role) SELECT 'a0000000-0000-4000-8000-00000000000f','entregador'
 WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id='a0000000-0000-4000-8000-00000000000f');
SET session_replication_role = origin;
INSERT INTO public.orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,payment_method,address,created_at,origem_venda) VALUES
 ('0d000000-0000-4000-8000-0000000004c1','a0000000-0000-4000-8000-00000000000b','0a000000-0000-4000-8000-000000000000','Cliente Concorrência Fictício','pending','recarga','Gás P13',125,1,'money','{}',now(),NULL),
 ('0d000000-0000-4000-8000-0000000004f1','a0000000-0000-4000-8000-00000000000b','0a000000-0000-4000-8000-000000000000','Cliente Fila Antiga Fictício','pending','recarga','Gás P13',125,1,'money','{}',now(),NULL),
 ('0d000000-0000-4000-8000-0000000004e1','a0000000-0000-4000-8000-00000000000b','0a000000-0000-4000-8000-000000000000','Cliente Contenção Navegador','pending','recarga','Gás P13',125,1,'money','{}',now(),NULL)
ON CONFLICT DO NOTHING;
INSERT INTO public.resellers(id,organization_id,name,phone,price_p13,active) VALUES
 ('0e000000-0000-4000-8000-0000000004a1','0a000000-0000-4000-8000-000000000000','Agregado Fictício','(00) 0000-0000',110,true)
ON CONFLICT DO NOTHING;
