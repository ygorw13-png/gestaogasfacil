
import React, { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { PromissoryNote } from "../types";

interface AssignedPromissoriesTableProps {
  promissories: PromissoryNote[];
  onPayment: (id: string) => void;
}

function AssignedPromissoriesTableComponent({ promissories, onPayment }: AssignedPromissoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Cobrador</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promissories.map((note) => (
          <TableRow key={note.id}>
            <TableCell>{note.clientName}</TableCell>
            <TableCell>R$ {(note.saldo ?? note.value).toFixed(2)}{note.paidAmount > 0 && <span className="block text-xs text-muted-foreground">de R$ {note.value.toFixed(2)}</span>}</TableCell>
            <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
            <TableCell>{note.assignedTo}</TableCell>
            <TableCell>
              <Button
                variant="outline"
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

export const AssignedPromissoriesTable = memo(AssignedPromissoriesTableComponent);
