
import { Label } from "@/components/ui/label";

interface ClientDetails {
  id: string;
  name: string;
  phone: string;
  address: string;
  cylinderCount: number;
  cylinderTypes: string[];
  notes: string;
}

interface ClientDetailsTabProps {
  client: ClientDetails;
}

export function ClientDetailsTab({ client }: ClientDetailsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-muted-foreground">Telefone</Label>
        <p className="font-medium">{client.phone}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Endereço</Label>
        <p className="font-medium">{client.address}</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Vasilhames em Comodato</Label>
        <p className="font-medium">{client.cylinderCount} ({client.cylinderTypes.join(", ")})</p>
      </div>
      <div>
        <Label className="text-muted-foreground">Observações</Label>
        <p className="font-medium">{client.notes || "Sem observações"}</p>
      </div>
    </div>
  );
}
