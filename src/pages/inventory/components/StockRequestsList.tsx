import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StockRequest } from "@/types/supabaseTypes";
import { Loader2 } from "lucide-react";
import { customTables } from "@/integrations/supabase/customClient";

export function StockRequestsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await customTables.stockRequests.select();
        
      if (error) throw error;
      
      // Fixed the type casting to correctly handle the Supabase response
      if (data) {
        setRequests(data);
      }
    } catch (error: any) {
      console.error("Erro ao buscar requisições:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar as requisições de estoque",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleProcessRequest = async (id: string, newStatus: 'aprovada' | 'recusada') => {
    try {
      const { error } = await customTables.stockRequests.update({
        id,
        status: newStatus,
        processado_por: user?.id,
        data_processamento: new Date().toISOString()
      });
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Requisição ${newStatus === 'aprovada' ? 'aprovada' : 'recusada'} com sucesso`
      });
      
      // Atualizar a lista de requisições
      fetchRequests();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pendente</Badge>;
      case 'aprovada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Aprovada</Badge>;
      case 'recusada':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Recusada</Badge>;
      case 'cancelada':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Cancelada</Badge>;
      case 'entregue':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Entregue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Requisições de Estoque</h3>
          <Button 
            variant="outline" 
            onClick={fetchRequests}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Atualizar"}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  {/* Mostrar ações apenas para admins, gerentes ou estoque */}
                  {(user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'estoque') && (
                    <TableHead>Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{formatDate(req.data_solicitacao)}</TableCell>
                    <TableCell>{(req.solicitante as any)?.name || 'Desconhecido'}</TableCell>
                    <TableCell className="capitalize">{req.origem}</TableCell>
                    <TableCell className="capitalize">{req.destino}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside">
                        {Array.isArray(req.itens) && req.itens.map((item: any, i: number) => (
                          <li key={i}>
                            {item.quantidade}x {item.produto === 'agua' ? 'Água 20L' : `GLP ${item.produto}`}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    {/* Mostrar ações apenas para admins, gerentes ou estoque */}
                    {(user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'estoque') && req.status === 'pendente' && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            onClick={() => handleProcessRequest(req.id, 'aprovada')}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                            onClick={() => handleProcessRequest(req.id, 'recusada')}
                          >
                            Recusar
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhuma requisição de estoque encontrada
          </div>
        )}
      </div>
    </Card>
  );
}
