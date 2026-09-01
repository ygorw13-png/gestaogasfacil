import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CreditCard, FileText } from "lucide-react";
import { PromissoryNote } from "../types";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { msgPromissoria } from "@/utils/whatsappLinks";
import { noteSeverity, severityBadgeClass, severityLabel, diasAtraso } from "../utils/promissoryStatus";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientName?: string;
  phone?: string;
  notes: PromissoryNote[];
  onAssign: (id: string) => void;
  onPayment: (id: string) => void;
}

export function ClientPromissoryDialog({ open, onOpenChange, clientName, phone, notes, onAssign, onPayment }: Props) {
  const total = notes.reduce((s, n) => s + n.value, 0);
  const first = notes[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{clientName}</DialogTitle>
          <DialogDescription>
            {notes.length} nota(s) em aberto · Total R$ {total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        {first && (
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppButton
              phone={phone}
              label="Cobrar no WhatsApp"
              message={msgPromissoria({
                clientName: clientName || "",
                value: total,
                dueDate: first.dueDate,
                vencida: notes.some((n) => n.status === "overdue"),
              })}
            />
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => {
                const sev = noteSeverity(note);
                const atraso = diasAtraso(note.dueDate);
                return (
                  <TableRow key={note.id}>
                    <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
                    <TableCell>R$ {note.value.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityBadgeClass(sev)}>
                        {severityLabel(sev, atraso)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onAssign(note.id)} className="gap-1">
                          <FileText className="h-4 w-4" />
                          Atribuir
                        </Button>
                        <Button size="sm" onClick={() => onPayment(note.id)} className="gap-1">
                          <CreditCard className="h-4 w-4" />
                          Pagamento
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
