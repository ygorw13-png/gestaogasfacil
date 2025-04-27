
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientSection } from "./new-promissory/ClientSection";
import { ValueSection } from "./new-promissory/ValueSection";
import { DueDateSection } from "./new-promissory/DueDateSection";
import { CollectorSection } from "./new-promissory/CollectorSection";

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
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [collector, setCollector] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined);
  const [isNewClient, setIsNewClient] = useState(false);
  
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
            <ClientSection 
              clients={clients}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              clientName={clientName}
              setClientName={setClientName}
              isNewClient={isNewClient}
            />
            
            <ValueSection
              value={value}
              setValue={setValue}
            />
            
            <DueDateSection
              dueDate={dueDate}
              setDueDate={setDueDate}
            />
            
            <CollectorSection
              collectors={collectors}
              collector={collector}
              setCollector={setCollector}
            />
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
