
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle } from "lucide-react";
import { InventoryTableProps } from "../types/cashierTypes";
import { useState } from "react";

export const InventoryTable = ({ data }: InventoryTableProps) => {
  const [loans, setLoans] = useState<{ [key: string]: number }>({});
  const [returns, setReturns] = useState<{ [key: string]: number }>({});

  const calculateExpectedFinal = (item: any) => {
    const loanValue = loans[item.product] || 0;
    const returnValue = returns[item.product] || 0;
    const expected = item.initial + item.additions - item.sales - loanValue + returnValue;
    return expected;
  };

  const handleLoanChange = (product: string, value: string) => {
    setLoans(prev => ({
      ...prev,
      [product]: Number(value) || 0
    }));
  };

  const handleReturnChange = (product: string, value: string) => {
    setReturns(prev => ({
      ...prev,
      [product]: Number(value) || 0
    }));
  };

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
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={loans[item.product] || ""}
                      onChange={(e) => handleLoanChange(item.product, e.target.value)}
                      className="w-20 text-right"
                      min="0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={returns[item.product] || ""}
                      onChange={(e) => handleReturnChange(item.product, e.target.value)}
                      className="w-20 text-right"
                      min="0"
                    />
                  </TableCell>
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
