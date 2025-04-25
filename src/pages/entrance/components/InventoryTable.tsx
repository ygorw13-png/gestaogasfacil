
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { InventoryTableProps, InventoryMovement } from "../types/cashierTypes";
import { useState, useEffect } from "react";

export const InventoryTable = ({ data }: InventoryTableProps) => {
  const [loans, setLoans] = useState<{ [key: string]: number }>({});
  const [returns, setReturns] = useState<{ [key: string]: number }>({});

  const calculateExpectedFinal = (item: any) => {
    const loanValue = loans[item.product] || 0;
    const returnValue = returns[item.product] || 0;
    const expected = item.initial + item.additions - item.sales - loanValue + returnValue;
    return expected;
  };

  useEffect(() => {
    // Calculate loans and returns from inventory movements
    const movements = 'inventoryMovements' in data ? data.inventoryMovements : [];
    if (movements && movements.length > 0) {
      const newLoans: { [key: string]: number } = {};
      const newReturns: { [key: string]: number } = {};

      movements.forEach((movement: InventoryMovement) => {
        if (movement.type === 'loan') {
          newLoans[movement.product] = (newLoans[movement.product] || 0) + movement.quantity;
        } else {
          newReturns[movement.product] = (newReturns[movement.product] || 0) + movement.quantity;
        }
      });

      setLoans(newLoans);
      setReturns(newReturns);
    }
  }, [data]);

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
              <TableHead className="text-right">Empréstimos</TableHead>
              <TableHead className="text-right">Devoluções</TableHead>
              <TableHead className="text-right">Final Esperado</TableHead>
              <TableHead className="text-right">Final Real</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const expectedFinal = calculateExpectedFinal(item);
              const isMatch = expectedFinal === item.final;

              return (
                <TableRow key={index}>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="text-right">{item.initial}</TableCell>
                  <TableCell className="text-right">{item.additions}</TableCell>
                  <TableCell className="text-right">{item.sales}</TableCell>
                  <TableCell className="text-right">{loans[item.product] || 0}</TableCell>
                  <TableCell className="text-right">{returns[item.product] || 0}</TableCell>
                  <TableCell className="text-right">{expectedFinal}</TableCell>
                  <TableCell className="text-right">{item.final}</TableCell>
                  <TableCell className="text-right">
                    {isMatch ? (
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
