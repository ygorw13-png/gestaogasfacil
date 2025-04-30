
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export function CylinderControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<CylinderLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  // Função para carregar empréstimos
  const fetchLoans = async () => {
    setDataLoading(true);
    try {
      const { data, error: loansError } = await customTables.cylinderLoans.select();
      
      if (loansError) {
        throw loansError;
      }
      
      setLoans(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar empréstimos:", err);
      setError("Erro ao carregar empréstimos de vasilhames");
    } finally {
      setDataLoading(false);
    }
  };

  // Carregar dados iniciais: empréstimos e clientes
  useEffect(() => {
    // Buscar empréstimos
    fetchLoans();
    
    // Buscar clientes
    const fetchClients = async () => {
      try {
        const { data, error: clientsError } = await supabase.from('clients').select('id, name');
        
        if (clientsError) {
          throw clientsError;
        }
        
        setClients(data || []);
      } catch (err: any) {
        console.error("Erro ao buscar clientes:", err);
        setError(prev => prev || "Erro ao carregar lista de clientes");
      }
    };
    
    fetchClients();
  }, []);

  const handleRegisterLoan = async (data: CylinderLoanFormData) => {
    setLoading(true);
    try {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await customTables.cylinderLoans.insert({
        cliente_id: data.clientId,
        tipo_cliente: data.tipoCliente,
        tipo_vasilhame: data.tipoVasilhame,
        quantidade: data.quantidade,
        status: 'emprestado',
        registrado_por: user.id,
        data_emprestimo: new Date().toISOString()
      });
      
      if (error) throw error;
      
      toast({
        title: "Empréstimo registrado",
        description: `${data.quantidade} vasilhame(s) de ${data.tipoVasilhame === 'agua' ? 'Água 20L' : `GLP ${data.tipoVasilhame}`} emprestado(s) com sucesso`
      });
      
      // Atualizar lista de empréstimos
      fetchLoans();
      
    } catch (error: any) {
      handleError(error, "Erro ao registrar empréstimo");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterReturn = async (loanId: string, currentQty: number) => {
    try {
      const returnQty = Number(prompt(`Quantos vasilhames estão sendo devolvidos? (máximo: ${currentQty})`));
      
      if (!returnQty || isNaN(returnQty) || returnQty <= 0 || returnQty > currentQty) {
        toast({
          title: "Quantidade inválida",
          description: "Por favor, informe uma quantidade válida",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      
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
      
      // Atualizar lista de empréstimos
      fetchLoans();
      
    } catch (error: any) {
      handleError(error, "Erro ao registrar devolução");
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while initial data is being fetched
  if (dataLoading && loans.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Render error state if there's an error
  if (error) {
    return (
      <Alert variant="warning" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error} Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
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
