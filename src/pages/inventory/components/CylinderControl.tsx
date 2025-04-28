
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { customTables } from "@/integrations/supabase/customClient";
import { CylinderLoan } from "@/types/supabaseTypes";
import { CylinderLoanForm } from "./cylinder-control/CylinderLoanForm";
import { ActiveLoansTable } from "./cylinder-control/ActiveLoansTable";
import { ReturnHistoryTable } from "./cylinder-control/ReturnHistoryTable";
import { Client, CylinderLoanFormData } from "./cylinder-control/types";

export function CylinderControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<CylinderLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchLoans();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');

      if (error) throw error;
      
      if (data) {
        setClients(data);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const fetchLoans = async () => {
    setLoadingLoans(true);
    try {
      const response = await customTables.cylinderLoans.select();
      if (response.error) throw response.error;
      setLoans(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar empréstimos:", error);
    } finally {
      setLoadingLoans(false);
    }
  };

  const handleRegisterLoan = async (data: CylinderLoanFormData) => {
    setLoading(true);
    try {
      const response = await customTables.cylinderLoans.insert({
        cliente_id: data.clientId,
        tipo_cliente: data.tipoCliente,
        tipo_vasilhame: data.tipoVasilhame,
        quantidade: data.quantidade,
        status: 'emprestado',
        registrado_por: user?.id || "",
        data_emprestimo: new Date().toISOString()
      });

      if (response.error) throw response.error;
      
      toast({
        title: "Empréstimo registrado",
        description: `${data.quantidade} vasilhame(s) de ${data.tipoVasilhame === 'agua' ? 'Água 20L' : `GLP ${data.tipoVasilhame}`} emprestado(s) com sucesso`
      });
      
      fetchLoans();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterReturn = async (loanId: string, currentQty: number) => {
    const returnQty = Number(prompt(`Quantos vasilhames estão sendo devolvidos? (máximo: ${currentQty})`));
    
    if (!returnQty || isNaN(returnQty) || returnQty <= 0 || returnQty > currentQty) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, informe uma quantidade válida",
        variant: "destructive"
      });
      return;
    }

    try {
      if (returnQty === currentQty) {
        const response = await customTables.cylinderLoans.update({
          id: loanId,
          status: 'devolvido',
          data_devolucao: new Date().toISOString()
        });
          
        if (response.error) throw response.error;
      } else {
        const response = await customTables.cylinderLoans.update({
          id: loanId,
          quantidade: currentQty - returnQty,
          status: 'parcial'
        });
          
        if (response.error) throw response.error;
      }
      
      toast({
        title: "Devolução registrada",
        description: `${returnQty} vasilhame(s) devolvido(s) com sucesso`
      });
      
      fetchLoans();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loadingLoans) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <CylinderLoanForm
        clients={clients}
        loading={loading}
        onSubmit={handleRegisterLoan}
      />

      <ActiveLoansTable
        loans={loans}
        clients={clients}
        onRegisterReturn={handleRegisterReturn}
      />

      <ReturnHistoryTable
        loans={loans}
        clients={clients}
      />
    </div>
  );
}
