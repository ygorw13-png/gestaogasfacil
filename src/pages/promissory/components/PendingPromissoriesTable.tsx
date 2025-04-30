
import React, { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CreditCard, FileText } from "lucide-react";
import { PromissoryNote } from "../types";

interface PendingPromissoriesTableProps {
  promissories: PromissoryNote[];
  onAssign: (id: string) => void;
  onPayment: (id: string) => void;
}

function PendingPromissoriesTableComponent({ 
  promissories, 
  onAssign, 
  onPayment 
}: PendingPromissoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promissories.map((note) => (
          <TableRow key={note.id}>
            <TableCell>{note.clientName}</TableCell>
            <TableCell>R$ {note.value.toFixed(2)}</TableCell>
            <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
            <TableCell>
              <Badge 
                variant={note.status === "overdue" ? "destructive" : "outline"}
              >
                {note.status === "pending" ? "Pendente" : 
                 note.status === "overdue" ? "Atrasada" : 
                 note.status === "assigned" ? "Atribuída" : "Paga"}
              </Badge>
            </TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAssign(note.id)}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Atribuir Entregador
              </Button>
              <Button
                size="sm"
                onClick={() => onPayment(note.id)}
                className="flex items-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                Registrar Pagamento
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const PendingPromissoriesTable = memo(PendingPromissoriesTableComponent);
