import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { CashierContext } from "@/contexts/CashierContext";

/**
 * Botão "Registrar Venda" dos diálogos (o formulário fica dentro do diálogo e o botão no rodapé,
 * ligado pelo atributo `form`). Fica desabilitado enquanto a venda é gravada.
 */
export function RegisterSaleButton() {
  const caixa = useContext(CashierContext);
  const salvando = caixa?.salvandoVenda ?? false;
  return (
    <Button form="sale-form" type="submit" disabled={salvando}>
      {salvando ? "Registrando…" : "Registrar Venda"}
    </Button>
  );
}
