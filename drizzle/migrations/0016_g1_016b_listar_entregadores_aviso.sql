CREATE OR REPLACE FUNCTION public.listar_entregadores_aviso()
RETURNS TABLE(id uuid, nome text, vinculado boolean, telefone_valido boolean, telefone_final text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o uuid := public._ctx_org(); BEGIN
  IF NOT public.is_operador() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT p.id, p.name, c.id IS NOT NULL, public._telefone_whatsapp(c.telefone) IS NOT NULL,
      CASE WHEN public._telefone_whatsapp(c.telefone) IS NOT NULL THEN right(public._telefone_whatsapp(c.telefone), 4) END
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'entregador'
    LEFT JOIN public.colaboradores c ON c.organization_id = o AND c.user_id = p.id
   WHERE p.organization_id = o AND p.ativo ORDER BY p.name;
END $$;
REVOKE ALL ON FUNCTION public.listar_entregadores_aviso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_entregadores_aviso() TO authenticated, service_role;