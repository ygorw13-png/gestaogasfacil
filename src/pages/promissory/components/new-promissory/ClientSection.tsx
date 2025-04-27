
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientSectionProps {
  clients: string[];
  selectedClient: string | undefined;
  setSelectedClient: (value: string) => void;
  clientName: string;
  setClientName: (value: string) => void;
  isNewClient: boolean;
}

export function ClientSection({
  clients,
  selectedClient,
  setSelectedClient,
  clientName,
  setClientName,
  isNewClient
}: ClientSectionProps) {
  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="client-select" className="text-right">
          Cliente
        </Label>
        <Select
          value={selectedClient}
          onValueChange={setSelectedClient}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione um cliente existente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client} value={client}>
                {client}
              </SelectItem>
            ))}
            <SelectItem value="new">Novo Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isNewClient && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="client-name" className="text-right">
            Nome do Cliente
          </Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: João Silva"
            className="col-span-3"
          />
        </div>
      )}
    </>
  );
}
