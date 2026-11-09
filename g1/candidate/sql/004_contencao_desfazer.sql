-- Desfaz a contenção 004: devolve ao entregador as ações controladas (nenhuma gravação direta).
GRANT EXECUTE ON FUNCTION public.entregador_aceitar_entrega(uuid), public.entregador_recusar_entrega(uuid,text),
  public.entregador_concluir_entrega(uuid,text,integer,text),
  public.entregador_venda_rua(uuid,text,text,text,integer,numeric,text,text,integer,integer,text,text) TO authenticated;
