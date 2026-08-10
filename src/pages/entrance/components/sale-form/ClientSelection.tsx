import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SaleFormClient {
  id: string;
  name: string;
  phone: string;
  origem?: "cliente" | "ponto";
}

interface ClientSelectionProps {
  selectedClient: SaleFormClient | null;
  onSelectClient: (client: SaleFormClient | null) => void;
  clients: SaleFormClient[];
  loading?: boolean;
}

export function ClientSelection({
  selectedClient,
  onSelectClient,
  clients,
  loading = false,
}: ClientSelectionProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone || "").includes(q)
    );
  }, [clients, search]);

  return (
    <div className="space-y-2">
      <Label>Cliente</Label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente por nome ou telefone..."
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSelectClient(null)}
          className={cn(
            "w-full justify-start rounded-none border-b font-medium",
            !selectedClient && "bg-accent"
          )}
        >
          {!selectedClient && <Check className="mr-2 h-4 w-4" />}
          Venda Avulsa
        </Button>

        <ScrollArea className="h-40">
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Carregando clientes...</p>
          ) : filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            filtered.map((client) => {
              const active = selectedClient?.id === client.id;
              return (
                <Button
                  key={client.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectClient(client)}
                  className={cn(
                    "w-full justify-start rounded-none h-auto py-2",
                    active && "bg-accent"
                  )}
                >
                  {active && <Check className="mr-2 h-4 w-4 shrink-0" />}
                  <span className="flex flex-col items-start">
                    <span className="text-sm flex items-center gap-2">
                      {client.name}
                      {client.origem === "ponto" && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          Ponto de revenda
                        </span>
                      )}
                    </span>
                    {client.phone && (
                      <span className="text-xs text-muted-foreground">{client.phone}</span>
                    )}
                  </span>
                </Button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {selectedClient && (
        <p className="text-xs text-muted-foreground">
          Cliente selecionado: <span className="font-medium">{selectedClient.name}</span>
        </p>
      )}
    </div>
  );
}
