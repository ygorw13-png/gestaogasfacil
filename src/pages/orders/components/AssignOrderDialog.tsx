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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
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
  const { data: entregadores = [], isLoading } = useEntregadoresApp();

  const entregador = entregadores.find((c) => c.id === selectedDeliveryPerson);
  const mensagem = order ? msgEntregaAtribuida(order, entregador?.nome) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Pedido</DialogTitle>
          <DialogDescription>
            Selecione o entregador para realizar esta entrega. Só aparecem
            entregadores com acesso ao app — assim a entrega chega no celular dele.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryPerson">Entregador</Label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedDeliveryPerson} onValueChange={onDeliveryPersonChange}>
                <SelectTrigger id="deliveryPerson">
                  <SelectValue placeholder="Selecione o entregador" />
                </SelectTrigger>
                <SelectContent>
                  {entregadores.length === 0 ? (
                    <SelectItem value="no-option" disabled>
                      Nenhum entregador com acesso ao app
                    </SelectItem>
                  ) : (
                    entregadores.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {!isLoading && entregadores.length === 0 && (
            <p className="text-xs text-destructive">
              Nenhum usuário com perfil de entregador. Crie a conta e defina a
              função "entregador" em Configurações {">"} Usuários.
            </p>
          )}

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
