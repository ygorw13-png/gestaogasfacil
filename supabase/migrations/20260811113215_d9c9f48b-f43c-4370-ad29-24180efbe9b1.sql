DROP FUNCTION IF EXISTS public.registrar_movimentacao_portaria(
  _tipo text,
  _produto text,
  _delta_cheios integer,
  _delta_vazios integer,
  _delta_emprestados integer,
  _cliente_id uuid,
  _cliente_nome text,
  _referencia_id uuid,
  _observacoes text
);

CREATE OR REPLACE FUNCTION public.registrar_movimentacao_portaria(
  _tipo text,
  _produto text,
  _delta_cheios integer,
  _delta_vazios integer,
  _delta_emprestados integer,
  _cliente_id uuid DEFAULT NULL,
  _cliente_nome text DEFAULT NULL,
  _referencia_id uuid DEFAULT NULL,
  _observacoes text DEFAULT NULL,
  _data_operacao date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id UUID;
  _user_name TEXT;
BEGIN
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.movimentacoes_portaria(
    organization_id, tipo, produto,
    delta_cheios, delta_vazios, delta_emprestados,
    cliente_id, cliente_nome, referencia_id, observacoes,
    registrado_por, registrado_por_nome, data_operacao
  ) VALUES (
    public.get_my_org(), _tipo, _produto,
    _delta_cheios, _delta_vazios, _delta_emprestados,
    _cliente_id, _cliente_nome, _referencia_id, _observacoes,
    auth.uid(), _user_name, _data_operacao
  ) RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_portaria TO authenticated;