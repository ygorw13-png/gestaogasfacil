
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { InventoryTableProps } from "../types/cashierTypes";

export const InventoryTable = ({ data }: InventoryTableProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Fechamento de Estoque</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Inicial</TableHead>
              <TableHead className="text-right">Adições</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right">Final</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.product}</TableCell>
                <TableCell className="text-right">{item.initial}</TableCell>
                <TableCell className="text-right">{item.additions}</TableCell>
                <TableCell className="text-right">{item.sales}</TableCell>
                <TableCell className="text-right">{item.final}</TableCell>
                <TableCell className="text-right">
                  {item.initial + item.additions - item.sales === item.final ? (
                    <span className="inline-flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Ok
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" /> Verificar
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
