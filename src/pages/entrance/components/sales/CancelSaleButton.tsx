import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AVISO_CANCELAMENTO, useCancelarVenda } from "../../hooks/useCancelarVenda";

interface CancelSaleButtonProps {
  saleId: string;
  client: string;
  product: string;
  quantity: number;
}

export function CancelSaleButton({ saleId, client, product, quantity }: CancelSaleButtonProps) {
  const cancelar = useCancelarVenda();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  const confirmar = () => {
    if (motivo.trim().length < 3) return;
    cancelar.mutate(
      { orderId: saleId, motivo: motivo.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setMotivo("");
        },
      },
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => {
          setMotivo("");
          setOpen(true);
        }}
      >
        <Ban className="mr-1 h-4 w-4" /> Cancelar
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda</AlertDialogTitle>
            <AlertDialogDescription>
              {client} · {product} · {quantity} un. {AVISO_CANCELAMENTO}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`motivo-${saleId}`}>Motivo do cancelamento</Label>
            <Textarea
              id={`motivo-${saleId}`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: lançamento errado, cliente desistiu..."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmar();
              }}
              disabled={motivo.trim().length < 3 || cancelar.isPending}
            >
              {cancelar.isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
