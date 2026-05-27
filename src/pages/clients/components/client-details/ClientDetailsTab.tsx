import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle } from "lucide-react";

interface ClientDetails {
  id: string;
  name: string;
  phone: string;
  address: string;
  cylinderCount: number;
  cylinderTypes: string[];
  notes: string;
}

interface ClientDetailsTabProps { client: ClientDetails; }

export function ClientDetailsTab({ client }: ClientDetailsTabProps) {
  const phoneDigits = (client.phone || "").replace(/\D/g, "");

  const openMaps = () => {
    if (!client.address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openWhatsApp = () => {
    if (!phoneDigits) return;
    const phone = phoneDigits.length <= 11 ? `55${phoneDigits}` : phoneDigits;
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

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
          <p className="font-medium">{client.cylinderCount} ({client.cylinderTypes.join(", ") || "—"})</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Observações</Label>
          <p className="font-medium">{client.notes || "Sem observações"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {client.address && (
          <Button variant="outline" size="sm" onClick={openMaps}>
            <MapPin className="h-4 w-4 mr-1" /> Abrir no Maps
          </Button>
        )}
        {phoneDigits && (
          <Button variant="outline" size="sm" onClick={openWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
