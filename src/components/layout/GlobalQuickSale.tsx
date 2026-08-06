import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import QuickSaleDialog from "@/pages/orders/components/QuickSaleDialog";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Atalho global F2: abre a Venda Rápida em qualquer tela.
 */
export const GlobalQuickSale = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isEntregador } = useUserRole();

  useEffect(() => {
    if (isEntregador) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEntregador]);

  if (isEntregador) return null;

  return (
    <QuickSaleDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ["vendas-hoje"] });
        queryClient.invalidateQueries({ queryKey: ["late-orders-count"] });
        queryClient.invalidateQueries({ queryKey: ["movimentacoes-portaria"] });
      }}
    />
  );
};
