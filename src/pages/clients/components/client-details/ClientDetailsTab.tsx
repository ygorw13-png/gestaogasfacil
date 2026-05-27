import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, MessageCircle } from "lucide-react";

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
  const phoneDigits = (client.phone || "").replace(/\D/g, "");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address || "")}`;
  const waUrl = phoneDigits ? `https://wa.me/55${phoneDigits}` : null;
  const telUrl = phoneDigits ? `tel:+55${phoneDigits}` : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Telefone</Label>
          <p className="font-medium">{client.phone || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Endereço</Label>
          <p className="font-medium">{client.address || "—"}</p>
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

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {client.address && (
          <Button variant="outline" size="sm" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4 mr-1" /> Abrir no Maps
            </a>
          </Button>
        )}
        {waUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
            </a>
          </Button>
        )}
        {telUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={telUrl}>
              <Phone className="h-4 w-4 mr-1" /> Ligar
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
