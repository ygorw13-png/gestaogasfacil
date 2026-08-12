import React, { memo, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CreditCard, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { PromissoryNote } from "../types";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { msgPromissoria } from "@/utils/whatsappLinks";

interface PendingPromissoriesTableProps {
  promissories: PromissoryNote[];
  onAssign: (id: string) => void;
  onPayment: (id: string) => void;
}

const statusLabel = (s: PromissoryNote["status"]) =>
  s === "pending" ? "Pendente" : s === "overdue" ? "Atrasada" : s === "assigned" ? "Atribuída" : "Paga";

function PendingPromissoriesTableComponent({
  promissories,
  onAssign,
  onPayment,
}: PendingPromissoriesTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, PromissoryNote[]>();
    promissories.forEach((n) => {
      const key = n.clientName.trim();
      map.set(key, [...(map.get(key) || []), n]);
    });
    return Array.from(map.entries())
      .map(([name, notes]) => ({
        name,
        notes: [...notes].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
        total: notes.reduce((s, n) => s + n.value, 0),
        hasOverdue: notes.some((n) => n.status === "overdue"),
        phone: notes.find((n) => n.clientPhone)?.clientPhone,
      }))
      .sort((a, b) => b.total - a.total);
  }, [promissories]);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma promissória pendente.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Notas</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Vencimento mais próximo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((g) => {
          const isOpen = !!expanded[g.name];
          const first = g.notes[0];
          return (
            <React.Fragment key={g.name}>
              <TableRow className="cursor-pointer" onClick={() => setExpanded((p) => ({ ...p, [g.name]: !isOpen }))}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1">
                    {g.notes.length > 1 ? (
                      isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                    ) : (
                      <span className="w-4" />
                    )}
                    {g.name}
                  </span>
                </TableCell>
                <TableCell>{g.notes.length}</TableCell>
                <TableCell>R$ {g.total.toFixed(2)}</TableCell>
                <TableCell>{format(first.dueDate, "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={g.hasOverdue ? "destructive" : "outline"}>
                    {g.hasOverdue ? "Atrasada" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <WhatsAppButton
                    phone={g.phone}
                    label="Cobrar"
                    message={msgPromissoria({
                      clientName: g.name,
                      value: g.total,
                      dueDate: first.dueDate,
                      vencida: g.hasOverdue,
                    })}
                  />
                </TableCell>
              </TableRow>

              {(isOpen || g.notes.length === 1) &&
                g.notes.map((note) => (
                  <TableRow key={note.id} className="bg-muted/40">
                    <TableCell className="pl-10 text-sm text-muted-foreground">Nota</TableCell>
                    <TableCell />
                    <TableCell>R$ {note.value.toFixed(2)}</TableCell>
                    <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={note.status === "overdue" ? "destructive" : "outline"}>
                        {statusLabel(note.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => onAssign(note.id)} className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Atribuir
                      </Button>
                      <Button size="sm" onClick={() => onPayment(note.id)} className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        Pagamento
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

export const PendingPromissoriesTable = memo(PendingPromissoriesTableComponent);
