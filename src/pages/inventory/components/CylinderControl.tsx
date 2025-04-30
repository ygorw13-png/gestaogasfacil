
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { customTables } from "@/integrations/supabase/customClient";
import { CylinderLoan } from "@/types/supabaseTypes";
import { CylinderLoanForm } from "./cylinder-control/CylinderLoanForm";
import { ActiveLoansTable } from "./cylinder-control/ActiveLoansTable";
import { ReturnHistoryTable } from "./cylinder-control/ReturnHistoryTable";
import { Client, CylinderLoanFormData } from "./cylinder-control/types";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseMutation } from "@/hooks/useSupabaseMutation";

export function CylinderControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Usar o hook personalizado para carregar empréstimos
  const { 
    data: loans, 
    loading: loadingLoans,
    refetch: fetchLoans
  } = useSupabaseQuery<CylinderLoan>({
    queryFn: () => customTables.cylinderLoans.select(),
    errorMessage: "Erro ao buscar empréstimos"
  });

  // Buscar clientes quando o componente montar
  useSupabaseQuery<Client>({
    queryFn: async () => {
      return await supabase.from('clients').select('id, name');
    },
    onSuccess: (data) => setClients(data),
    errorMessage: "Erro ao buscar clientes"
  });

  // Hook para registro de novos empréstimos
  const loanMutation = useSupabaseMutation<CylinderLoan, Omit<CylinderLoan, 'id'>>({
    mutationFn: (data) => customTables.cylinderLoans.insert(data),
    onSuccess: () => fetchLoans(),
    successMessage: "Empréstimo registrado com sucesso",
    errorMessage: "Erro ao registrar empréstimo"
  });

  const handleRegisterLoan = async (data: CylinderLoanFormData) => {
    setLoading(true);
    try {
      await loanMutation.mutate({
        cliente_id: data.clientId,
        tipo_cliente: data.tipoCliente,
        tipo_vasilhame: data.tipoVasilhame,
        quantidade: data.quantidade,
        status: 'emprestado',
        registrado_por: user?.id || "",
        data_emprestimo: new Date().toISOString()
      });
      
      toast({
        title: "Empréstimo registrado",
        description: `${data.quantidade} vasilhame(s) de ${data.tipoVasilhame === 'agua' ? 'Água 20L' : `GLP ${data.tipoVasilhame}`} emprestado(s) com sucesso`
      });
      
    } catch (error: any) {
      // Erro já tratado pelo hook useSupabaseMutation
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
        const { error } = await customTables.cylinderLoans.update({
          id: loanId,
          status: 'devolvido',
          data_devolucao: new Date().toISOString()
        });
          
        if (error) throw error;
      } else {
        const { error } = await customTables.cylinderLoans.update({
          id: loanId,
          quantidade: currentQty - returnQty,
          status: 'parcial'
        });
          
        if (error) throw error;
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
