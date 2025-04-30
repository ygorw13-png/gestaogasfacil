
import React, { memo, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CylinderLoan } from "@/types/supabaseTypes";
import { Client } from "./types";

interface ActiveLoansTableProps {
  loans: CylinderLoan[];
  clients: Client[];
  onRegisterReturn: (loanId: string, currentQty: number) => void;
}

function ActiveLoansTableComponent({ loans, clients, onRegisterReturn }: ActiveLoansTableProps) {
  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  }, []);

  const activeLoans = loans.filter(loan => loan.status !== 'devolvido');

  if (activeLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empréstimos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Nenhum empréstimo de vasilhame ativo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empréstimos Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vasilhame</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Data Empréstimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{clients.find(c => c.id === loan.cliente_id)?.name}</TableCell>
                  <TableCell>
                    {loan.tipo_vasilhame === 'agua' ? 'Água 20L' : `GLP ${loan.tipo_vasilhame}`}
                  </TableCell>
                  <TableCell>{loan.quantidade}</TableCell>
                  <TableCell>{formatDate(loan.data_emprestimo)}</TableCell>
                  <TableCell>
                    {loan.status === 'emprestado' ? 'Emprestado' : 'Devolução Parcial'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onRegisterReturn(loan.id, loan.quantidade)}
                    >
                      Registrar Devolução
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export const ActiveLoansTable = memo(ActiveLoansTableComponent);
