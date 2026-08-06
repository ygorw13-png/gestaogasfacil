import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ColaboradorSelect } from "@/components/inputs/ColaboradorSelect";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { customTables } from "@/integrations/supabase/customClient";
import { Colaborador } from "@/types/supabaseTypes";
import { msgEntregaAtribuida } from "@/utils/whatsappLinks";
import type { Order } from "../types";

interface AssignOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDeliveryPerson: string;
  onDeliveryPersonChange: (value: string) => void;
  onSubmit: () => void;
  order?: Order | null;
}

export function AssignOrderDialog({
  isOpen,
  onOpenChange,
  selectedDeliveryPerson,
  onDeliveryPersonChange,
  onSubmit,
  order,
}: AssignOrderDialogProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    customTables.colaboradores
      .selectAtivos()
      .then(({ data }) => setColaboradores((data as Colaborador[]) || []))
      .catch(() => setColaboradores([]));
  }, [isOpen]);

  const entregador = colaboradores.find((c) => c.id === selectedDeliveryPerson);
  const mensagem = order ? msgEntregaAtribuida(order, entregador?.nome) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Pedido</DialogTitle>
          <DialogDescription>
            Selecione o entregador para realizar esta entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryPerson">Entregador</Label>
            <ColaboradorSelect 
              value={selectedDeliveryPerson} 
              onValueChange={onDeliveryPersonChange}
              cargo="Entregador"
              placeholder="Selecione o entregador"
            />
          </div>

          {entregador && (
            <p className="text-xs text-muted-foreground">
              {entregador.telefone
                ? `WhatsApp do entregador: ${entregador.telefone}`
                : "Este entregador não tem telefone cadastrado — cadastre em Colaboradores para enviar o aviso."}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {order && (
            <WhatsAppButton
              phone={entregador?.telefone}
              message={mensagem}
              label="Confirmar e avisar no WhatsApp"
              size="default"
              disabled={!selectedDeliveryPerson}
              onSent={onSubmit}
            />
          )}
          <Button 
            onClick={onSubmit}
            disabled={!selectedDeliveryPerson}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
