-- 019 — Aviso mínimo ao entregador (Aplicativo do PC): só número do pedido + link HTTPS do pedido no site publicado.
-- Sem nome/endereço/telefone do cliente, produto, valor, forma ou observações (nem no texto, nem no link).
-- Aditivo: substitui só o corpo de _wd_texto; contrato v1 do whatsapp-desktop (job.text) e privilégios ficam iguais.
-- O acesso ao link é do próprio app: login + RLS "g1 entregador le suas entregas"
-- (conta ativa via get_my_org, mesma empresa, papel entregador, delivery_person_id = auth.uid()).
CREATE OR REPLACE FUNCTION public._wd_texto(_order uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT 'Nova entrega #' || upper(left(replace(o.id::text, '-', ''), 8)) || ' — abrir pedido' || chr(10)
      || 'https://gestaogasfacil.lovable.app/entregador/entregas?pedido=' || o.id::text
    FROM public.orders o WHERE o.id = _order $$;

REVOKE ALL ON FUNCTION public._wd_texto(uuid) FROM PUBLIC, anon, authenticated;
