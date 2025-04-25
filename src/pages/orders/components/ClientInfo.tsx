
import { MapPin, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "../types";

interface ClientInfoProps {
  order: Order;
  onCallClient: () => void;
}

export function ClientInfo({ order, onCallClient }: ClientInfoProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <MapPin size={16} className="text-muted-foreground" /> 
        Informações do Cliente
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Nome:</span>
          <span className="text-sm font-medium">{order.clientName}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Telefone:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{order.clientPhone}</span>
            <Button 
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onCallClient}
            >
              <PhoneCall size={14} />
            </Button>
          </div>
        </div>
        <div className="col-span-2">
          <span className="text-sm text-muted-foreground">Endereço:</span>
          <span className="text-sm font-medium block mt-1">
            {order.address.street}, {order.address.number}
            {order.address.complement && `, ${order.address.complement}`}
            {order.address.neighborhood && ` - ${order.address.neighborhood}`}
          </span>
        </div>
      </div>

      <div className="border rounded-md h-[180px] mt-4 flex items-center justify-center bg-muted">
        <div className="text-center text-sm text-muted-foreground">
          <MapPin size={24} className="mx-auto mb-2" />
          <p>Mapa de localização</p>
          <p>Implementação futura</p>
        </div>
      </div>
    </div>
  );
}
