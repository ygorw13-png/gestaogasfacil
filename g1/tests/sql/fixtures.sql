-- Dados fictícios para o banco descartável local (nunca produção)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
SET session_replication_role = replica;
INSERT INTO auth.users(id,email) VALUES
 ('a0000000-0000-4000-8000-00000000000a','admin.a@ficticio.test'),
 ('a0000000-0000-4000-8000-00000000000b','user.a@ficticio.test'),
 ('a0000000-0000-4000-8000-00000000000c','inativo.a@ficticio.test'),
 ('a0000000-0000-4000-8000-00000000000d','entregador.a@ficticio.test'),
 ('a0000000-0000-4000-8000-00000000000e','admin.inativo.a@ficticio.test'),
 ('b0000000-0000-4000-8000-00000000000a','admin.b@ficticio.test'),
 ('c0000000-0000-4000-8000-00000000000a','semperfil@ficticio.test');
INSERT INTO public.organizations(id,name,owner_id) VALUES
 ('0a000000-0000-4000-8000-000000000000','Empresa A Fictícia','a0000000-0000-4000-8000-00000000000a'),
 ('0b000000-0000-4000-8000-000000000000','Empresa B Fictícia','b0000000-0000-4000-8000-00000000000a');
INSERT INTO public.profiles(id,name,role,organization_id,ativo) VALUES
 ('a0000000-0000-4000-8000-00000000000a','Admin A','admin','0a000000-0000-4000-8000-000000000000',true),
 ('a0000000-0000-4000-8000-00000000000b','User A','user','0a000000-0000-4000-8000-000000000000',true),
 ('a0000000-0000-4000-8000-00000000000c','Inativo A','user','0a000000-0000-4000-8000-000000000000',false),
 ('a0000000-0000-4000-8000-00000000000d','Entregador A','entregador','0a000000-0000-4000-8000-000000000000',true),
 ('a0000000-0000-4000-8000-00000000000e','Admin Inativo A','admin','0a000000-0000-4000-8000-000000000000',false),
 ('b0000000-0000-4000-8000-00000000000a','Admin B','admin','0b000000-0000-4000-8000-000000000000',true);
INSERT INTO public.user_roles(user_id,role) VALUES
 ('a0000000-0000-4000-8000-00000000000a','admin'),('a0000000-0000-4000-8000-00000000000b','user'),
 ('a0000000-0000-4000-8000-00000000000c','user'),('a0000000-0000-4000-8000-00000000000d','entregador'),
 ('a0000000-0000-4000-8000-00000000000e','admin'),('b0000000-0000-4000-8000-00000000000a','admin');
INSERT INTO public.orders(user_id,organization_id,client_name,status,tipo_venda,price,quantity,vasilhames_entregues,vasilhames_recebidos) VALUES
 ('a0000000-0000-4000-8000-00000000000a','0a000000-0000-4000-8000-000000000000','Cliente A1','delivered','recarga',125,1,0,1),
 ('a0000000-0000-4000-8000-00000000000c','0a000000-0000-4000-8000-000000000000','Cliente A2 (lançado pelo inativo)','pending','recarga',125,1,0,0),
 ('b0000000-0000-4000-8000-00000000000a','0b000000-0000-4000-8000-000000000000','Cliente B1','delivered','recarga',130,1,0,1);
INSERT INTO public.colaboradores(nome,cargo,organization_id,situacao) VALUES
 ('Cobrador A','cobrador','0a000000-0000-4000-8000-000000000000','ativo'),
 ('Cobrador B','cobrador','0b000000-0000-4000-8000-000000000000','ativo');
INSERT INTO public.dashboard_data(user_id,organization_id,stock_data,sales_data) VALUES
 ('system','0b000000-0000-4000-8000-000000000000','{"segredo":"B"}','{}');
INSERT INTO public.entregador_localizacoes(user_id,organization_id,latitude,longitude) VALUES
 ('a0000000-0000-4000-8000-00000000000d','0a000000-0000-4000-8000-000000000000',-12.1,-38.9);
SET session_replication_role = origin;
