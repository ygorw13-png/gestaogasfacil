
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PromissoryFiltersProps {
  selectedStatus: string;
  selectedClient: string;
  onStatusChange: (value: string) => void;
  onClientChange: (value: string) => void;
  clients: string[];
}

export function PromissoryFilters({ 
  selectedStatus, 
  selectedClient, 
  onStatusChange, 
  onClientChange, 
  clients 
}: PromissoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="space-y-1">
        <Label htmlFor="status-filter">Filtrar por status</Label>
        <Select
          value={selectedStatus}
          onValueChange={onStatusChange}
        >
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue placeholder="Selecionar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="assigned">Atribuídas</SelectItem>
            <SelectItem value="paid">Pagas</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="client-filter">Filtrar por cliente</Label>
        <Select
          value={selectedClient}
          onValueChange={onClientChange}
        >
          <SelectTrigger id="client-filter" className="w-[200px]">
            <SelectValue placeholder="Selecionar cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map(client => (
              <SelectItem key={client} value={client}>{client}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
