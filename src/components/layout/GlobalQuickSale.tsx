import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import QuickSaleDialog from "@/pages/orders/components/QuickSaleDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { SHORTCUTS } from "@/lib/shortcuts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Atalhos globais F1–F10 (F1 abre a Venda Rápida).
 */
export const GlobalQuickSale = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isEntregador } = useUserRole();

  useEffect(() => {
    if (isEntregador) return;
    const onKey = (e: KeyboardEvent) => {
      const s = SHORTCUTS.find((x) => x.key === e.key);
      if (!s) return;
      e.preventDefault();
      if (s.action === "nova-venda") setIsOpen(true);
      else if (s.action === "ajuda") setHelpOpen(true);
      else if (s.to) navigate(s.to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEntregador, navigate]);

  if (isEntregador) return null;

  return (
    <>
      <QuickSaleDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["vendas-hoje"] });
          queryClient.invalidateQueries({ queryKey: ["late-orders-count"] });
          queryClient.invalidateQueries({ queryKey: ["movimentacoes-portaria"] });
        }}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atalhos de teclado</DialogTitle>
            <DialogDescription>
              Use as teclas F1 a F10 para navegar rapidamente. F11 e F12 são do navegador.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {SHORTCUTS.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{s.label}</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                  {s.key}
                </kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
};
