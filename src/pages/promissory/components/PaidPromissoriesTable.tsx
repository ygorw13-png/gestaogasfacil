
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { PromissoryNote } from "../types";

interface PaidPromissoriesTableProps {
  promissories: PromissoryNote[];
}

export function PaidPromissoriesTable({ promissories }: PaidPromissoriesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Data Pagamento</TableHead>
          <TableHead>Método</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promissories.map((note) => (
          <TableRow key={note.id}>
            <TableCell>{note.clientName}</TableCell>
            <TableCell>R$ {note.value.toFixed(2)}</TableCell>
            <TableCell>
              {note.paidAt
                ? format(note.paidAt, "dd/MM/yyyy")
                : "N/A"}
            </TableCell>
            <TableCell>
              Valor pago integralmente
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
