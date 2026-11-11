-- G1 009 CANDIDATO — venda de balcão exige abertura e saldo disponível.
-- Aplicar somente em laboratório, depois de 001..008. Nenhuma publicação autorizada.
-- Decisão do proprietário: bloquear a venda sem abertura/saldo. Não reescreve histórico.
-- A verificação ocorre na movimentação: venda+estoque+recebimento continuam na mesma
-- transação da venda_portaria. Uma recusa desfaz inclusive pedido e chave de reenvio.
-- A trava é a mesma da transferência para carga (006), evitando disputar o último item.
CREATE OR REPLACE FUNCTION public._validar_saldo_venda_portaria()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d date := NEW.data_operacao; cheios integer; vazios integer; BEGIN
  IF NEW.tipo NOT IN ('venda','venda_comodato') THEN RETURN NEW; END IF;
  IF d IS NULL OR NEW.produto IS NULL OR NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Venda exige empresa, produto e data operacional';
  END IF;
  PERFORM public._travar_portaria(NEW.organization_id, NEW.produto, d);
  IF NOT EXISTS (SELECT 1 FROM public.movimentacoes_portaria m
      WHERE m.organization_id=NEW.organization_id AND m.data_operacao=d AND m.tipo='abertura') THEN
    RAISE EXCEPTION 'A abertura da portaria de % ainda não foi registrada. Confirme a abertura antes de vender', to_char(d,'DD/MM/YYYY');
  END IF;
  SELECT coalesce(sum(m.delta_cheios),0)::integer, coalesce(sum(m.delta_vazios),0)::integer
    INTO cheios, vazios FROM public.movimentacoes_portaria m
    WHERE m.organization_id=NEW.organization_id AND m.produto=NEW.produto AND m.data_operacao=d
      AND m.tipo NOT IN ('entrada_patio','ajuste_patio');
  IF NEW.delta_cheios < 0 AND cheios < -NEW.delta_cheios THEN
    RAISE EXCEPTION 'Saldo insuficiente na portaria para %: disponíveis % cheios, solicitados %',
      NEW.produto, greatest(cheios,0), -NEW.delta_cheios;
  END IF;
  IF NEW.delta_vazios < 0 AND vazios < -NEW.delta_vazios THEN
    RAISE EXCEPTION 'Saldo insuficiente na portaria para %: disponíveis % vazios, solicitados %',
      NEW.produto, greatest(vazios,0), -NEW.delta_vazios;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public._validar_saldo_venda_portaria() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS g1_validar_saldo_venda_portaria ON public.movimentacoes_portaria;
CREATE TRIGGER g1_validar_saldo_venda_portaria BEFORE INSERT ON public.movimentacoes_portaria
FOR EACH ROW EXECUTE FUNCTION public._validar_saldo_venda_portaria();