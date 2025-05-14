
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MovementsTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Data</TableHead>
        <TableHead>Produto</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead className="text-right">Quantidade</TableHead>
        <TableHead>Observações</TableHead>
      </TableRow>
    </TableHeader>
  );
}
