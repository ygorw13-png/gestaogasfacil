import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { CylinderLoan } from "@/types/supabaseTypes";
import { customTables } from "@/integrations/supabase/customClient";

export function CylinderControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [tipoCliente, setTipoCliente] = useState<"cliente" | "agregado">("cliente");
  const [tipoVasilhame, setTipoVasilhame] = useState<"P13" | "P20" | "P45" | "agua">("P13");
  const [quantidade, setQuantidade] = useState(1);
  const [loans, setLoans] = useState<CylinderLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

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
      const { data, error } = await customTables.cylinderLoans
        .select()
        .select('*, registrado_por(name)');
        
      if (error) throw error;
      
      if (data) {
        setLoans(data as unknown as CylinderLoan[]);
      }
    } catch (error) {
      console.error("Erro ao buscar empréstimos:", error);
    } finally {
      setLoadingLoans(false);
    }
  };

  const handleRegisterLoan = async () => {
    if (!clientId || !tipoVasilhame || quantidade <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await customTables.cylinderLoans.insert({
        cliente_id: clientId,
        tipo_cliente: tipoCliente,
        tipo_vasilhame: tipoVasilhame,
        quantidade,
        status: 'emprestado',
        registrado_por: user?.id || ""
      });
        
      if (error) throw error;
      
      toast({
        title: "Empréstimo registrado",
        description: `${quantidade} vasilhame(s) de ${tipoVasilhame === 'agua' ? 'Água 20L' : `GLP ${tipoVasilhame}`} emprestado(s) com sucesso`
      });
      
      setQuantidade(1);
      
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registro de Empréstimo de Vasilhame</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Cliente</label>
              <Select 
                value={tipoCliente} 
                onValueChange={(val: "cliente" | "agregado") => setTipoCliente(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente Final</SelectItem>
                  <SelectItem value="agregado">Agregado/Revenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Vasilhame</label>
              <Select 
                value={tipoVasilhame} 
                onValueChange={(val: "P13" | "P20" | "P45" | "agua") => setTipoVasilhame(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Vasilhame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P13">GLP P13</SelectItem>
                  <SelectItem value="P20">GLP P20</SelectItem>
                  <SelectItem value="P45">GLP P45</SelectItem>
                  <SelectItem value="agua">Água 20L</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input 
                type="number" 
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleRegisterLoan}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar Empréstimo"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empréstimos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLoans ? (
            <div className="text-center py-4">Carregando...</div>
          ) : loans.length > 0 ? (
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
                  {loans.filter(loan => loan.status !== 'devolvido').map((loan) => (
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
                          onClick={() => handleRegisterReturn(loan.id, loan.quantidade)}
                        >
                          Registrar Devolução
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Nenhum empréstimo de vasilhame ativo
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Devoluções</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLoans ? (
            <div className="text-center py-4">Carregando...</div>
          ) : loans.filter(loan => loan.status === 'devolvido').length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
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
                  {loans.filter(loan => loan.status === 'devolvido').map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>{clients.find(c => c.id === loan.cliente_id)?.name}</TableCell>
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
          ) : (
            <div className="text-center py-4 text-gray-500">
              Nenhuma devolução registrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
