
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Client {
  id: number;
  name: string;
  phone: string;
  type: string;
}

interface ClientSelectionProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  clients: Client[];
}

export function ClientSelection({ selectedClient, onSelectClient, clients }: ClientSelectionProps) {
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setClientSearchOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      <div className="flex gap-2">
        <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedClient ? selectedClient.name : "Selecionar cliente"}
              <Search className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandList>
                <CommandGroup heading="Clientes">
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      onSelect={() => handleSelectClient(client)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{client.name}</span>
                        <span className="text-xs text-muted-foreground">{client.phone}</span>
                      </div>
                      <span className="text-xs ml-auto bg-muted px-2 py-0.5 rounded-full">
                        {client.type}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon">
          <Users className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
