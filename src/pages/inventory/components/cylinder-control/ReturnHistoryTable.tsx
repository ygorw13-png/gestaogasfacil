
import React, { memo, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CylinderLoan } from "@/types/supabaseTypes";
import { Client } from "./types";

interface ReturnHistoryTableProps {
  loans: CylinderLoan[];
  clients: Client[];
}

function ReturnHistoryTableComponent({ loans, clients }: ReturnHistoryTableProps) {
  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  }, []);

  const returnedLoans = loans.filter(loan => loan.status === 'devolvido');

  if (returnedLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle id="history-title">Histórico de Devoluções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500" aria-live="polite" aria-atomic="true">
            Nenhuma devolução registrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="history-title">Histórico de Devoluções</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table aria-labelledby="history-title">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vasilhame</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Data Empréstimo</TableHead>
                <TableHead>Data Devolução</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnedLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{clients.find(c => c.id === loan.cliente_id)?.name || 'Cliente não encontrado'}</TableCell>
                  <TableCell>
                    {loan.tipo_vasilhame === 'agua' ? 'Água 20L' : `GLP ${loan.tipo_vasilhame}`}
                  </TableCell>
                  <TableCell>{loan.quantidade}</TableCell>
                  <TableCell>{formatDate(loan.data_emprestimo)}</TableCell>
                  <TableCell>{formatDate(loan.data_devolucao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export const ReturnHistoryTable = memo(ReturnHistoryTableComponent);
