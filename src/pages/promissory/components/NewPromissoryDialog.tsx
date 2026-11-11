
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
import type { Cobrador } from "../hooks/useCollectors";
import type { NovaPromissoria } from "../hooks/usePromissoryNotes";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";

interface NewPromissoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolve após a gravação confirmada; rejeita com o motivo. */
  onSubmit: (data: NovaPromissoria) => Promise<void> | void;
  collectors: Cobrador[];
  clients?: string[];
}

/** Data do seletor (meia-noite local) como "AAAA-MM-DD", sem passar por UTC. */
const dataLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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
  const [erro, setErro] = useState<string | null>(null);
  // Reenvio da MESMA promissória (resposta perdida) usa a mesma chave; uma nova recebe outra.
  const operacao = useOperacaoUnica("promissoria-manual");
  
  useEffect(() => {
    if (open) {
      setClientName("");
      setValue("");
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      setCollector(null);
      setSelectedClient(undefined);
      setIsNewClient(false);
      setErro(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(value);
    if (!clientName.trim() || !dueDate || !(valor > 0) || operacao.enviando) return;
    setErro(null);
    const cobrador = collectors.find((c) => c.id === collector) ?? null;
    const conteudo = { cliente: clientName.trim(), valor, vencimento: dataLocal(dueDate), cobrador: cobrador?.id ?? null };
    try {
      await operacao.executar(conteudo, (chave) =>
        Promise.resolve(onSubmit({ clientName: conteudo.cliente, value: valor, dueDate: conteudo.vencimento, cobrador, chave })));
      onOpenChange(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Promissória não registrada. Os dados foram mantidos.");
    }
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
          
          {erro && (
            <div role="alert" className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <p className="font-medium text-destructive">Promissória não registrada</p>
              <p>{erro}</p>
              {operacao.duvida && (
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); }}>
                  Descartar a tentativa anterior e registrar como nova
                </Button>
              )}
            </div>
          )}
          <p className="mb-3 text-xs text-muted-foreground">
            Promissória sem venda no sistema (ex.: dívida anterior). Entra no saldo a receber; não conta como venda nem como recebimento.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={operacao.enviando}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!clientName || !value || !dueDate || operacao.enviando}
            >
              {operacao.enviando ? "Registrando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
