
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewPromissoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    clientName: string;
    value: number;
    dueDate: Date;
    collector: string | null;
  }) => void;
  collectors: string[];
  clients?: string[];
}

export function NewPromissoryDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  collectors,
  clients = []
}: NewPromissoryDialogProps) {
  const [clientName, setClientName] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias a partir de hoje
  );
  const [collector, setCollector] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined);
  const [isNewClient, setIsNewClient] = useState(false);
  
  // Reset form on open change
  useEffect(() => {
    if (open) {
      setClientName("");
      setValue("");
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      setCollector(null);
      setSelectedClient(undefined);
      setIsNewClient(false);
    }
  }, [open]);
  
  // Handle client selection
  useEffect(() => {
    if (selectedClient && selectedClient !== "new") {
      setClientName(selectedClient);
      setIsNewClient(false);
    } else if (selectedClient === "new") {
      setClientName("");
      setIsNewClient(true);
    }
  }, [selectedClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !value || !dueDate) {
      return;
    }
    
    onSubmit({
      clientName,
      value: parseFloat(value),
      dueDate,
      collector
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Nota Promissória</DialogTitle>
          <DialogDescription>
            Cadastre uma nova nota promissória manualmente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Valor (R$)
              </Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
                placeholder="Ex: 150.00"
                type="text"
                inputMode="decimal"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">
                Data de Vencimento
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="due-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dueDate ? (
                        format(dueDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="collector" className="text-right">
                Cobrador (opcional)
              </Label>
              <Select
                value={collector || ""}
                onValueChange={setCollector}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Não atribuir agora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não atribuir agora</SelectItem>
                  {collectors.map(collector => (
                    <SelectItem key={collector} value={collector}>
                      {collector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!clientName || !value || !dueDate}
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
