import { memo, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { PromissoryNote } from "../types";
import { ClientPromissoryDialog } from "./ClientPromissoryDialog";
import {
  diasAtraso,
  severityBadgeClass,
  severityLabel,
  severityRowClass,
  worstSeverity,
} from "../utils/promissoryStatus";

interface PendingPromissoriesTableProps {
  promissories: PromissoryNote[];
  onAssign: (id: string) => void;
  onPayment: (id: string) => void;
}

function PendingPromissoriesTableComponent({ promissories, onAssign, onPayment }: PendingPromissoriesTableProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, PromissoryNote[]>();
    promissories.forEach((n) => {
      const key = n.clientName.trim();
      map.set(key, [...(map.get(key) || []), n]);
    });
    const order = { critico: 0, vencido: 1, proximo: 2, emdia: 3 } as const;
    return Array.from(map.entries())
      .map(([name, notes]) => {
        const sorted = [...notes].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        return {
          name,
          notes: sorted,
          total: notes.reduce((s, n) => s + n.value, 0),
          severity: worstSeverity(notes),
          nextDue: sorted[0].dueDate,
          phone: notes.find((n) => n.clientPhone)?.clientPhone,
        };
      })
      .sort((a, b) => order[a.severity] - order[b.severity] || b.total - a.total);
  }, [promissories]);

  const current = groups.find((g) => g.name === selected);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma promissória pendente.</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Notas</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="hidden md:table-cell">Próx. vencimento</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => {
              const atraso = diasAtraso(g.nextDue);
              return (
                <TableRow
                  key={g.name}
                  className={`cursor-pointer ${severityRowClass(g.severity)}`}
                  onClick={() => setSelected(g.name)}
                >
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {g.severity === "critico" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {g.severity === "proximo" && <Clock className="h-4 w-4 text-warning" />}
                      {g.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{g.notes.length}</TableCell>
                  <TableCell className="font-semibold">R$ {g.total.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(g.nextDue, "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={severityBadgeClass(g.severity)}>
                      {severityLabel(g.severity, atraso)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label={`Abrir ${g.name}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ClientPromissoryDialog
        open={!!current}
        onOpenChange={(v) => !v && setSelected(null)}
        clientName={current?.name}
        phone={current?.phone}
        notes={current?.notes || []}
        onAssign={(id) => {
          setSelected(null);
          onAssign(id);
        }}
        onPayment={(id) => {
          setSelected(null);
          onPayment(id);
        }}
      />
    </>
  );
}

export const PendingPromissoriesTable = memo(PendingPromissoriesTableComponent);
