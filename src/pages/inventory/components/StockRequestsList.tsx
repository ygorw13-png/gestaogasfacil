
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface StockRequestItem {
  produto: string;
  quantidade: number;
}

interface StockRequest {
  id: string;
  solicitante_id: string;
  solicitante_nome?: string;
  status: string;
  data_solicitacao: string;
  origem: string;
  destino: string;
  itens: StockRequestItem[];
  observacoes?: string;
}

export function StockRequestsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>;
      case 'aprovada':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Aprovada</Badge>;
      case 'entregue':
        return <Badge className="bg-green-500 hover:bg-green-600">Entregue</Badge>;
      case 'recusada':
        return <Badge className="bg-red-500 hover:bg-red-600">Recusada</Badge>;
      case 'cancelada':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLocationName = (code: string) => {
    switch (code) {
      case 'portaria': return 'Portaria';
      case 'estoque': return 'Estoque Central';
      case 'rota': return 'Rota';
      default: return code;
    }
  };

  const getProductName = (code: string) => {
    switch (code) {
      case 'P13': return 'GLP P13';
      case 'P20': return 'GLP P20';
      case 'P45': return 'GLP P45';
      case 'agua': return 'Água 20L';
      default: return code;
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('requisicoes_estoque')
        .update({
          status: 'aprovada',
          processado_por: user.id,
          data_processamento: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Requisição aprovada",
        description: "A requisição foi aprovada com sucesso"
      });
      
      // Atualizar a lista
      setRequests(
        requests.map((req) => req.id === id 
          ? { ...req, status: 'aprovada' } 
          : req
        )
      );
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('requisicoes_estoque')
        .update({
          status: 'recusada',
          processado_por: user.id,
          data_processamento: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Requisição recusada",
        description: "A requisição foi recusada"
      });
      
      // Atualizar a lista
      setRequests(
        requests.map((req) => req.id === id 
          ? { ...req, status: 'recusada' } 
          : req
        )
      );
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleComplete = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('requisicoes_estoque')
        .update({
          status: 'entregue',
          data_processamento: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Requisição concluída",
        description: "A entrega foi confirmada com sucesso"
      });
      
      // Atualizar a lista
      setRequests(
        requests.map((req) => req.id === id 
          ? { ...req, status: 'entregue' } 
          : req
        )
      );
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('requisicoes_estoque')
          .select('*')
          .order('data_solicitacao', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          // Buscar nomes dos solicitantes
          const userIds = [...new Set(data.map(req => req.solicitante_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
            
          const usersMap: Record<string, string> = {};
          if (profilesData) {
            profilesData.forEach(profile => {
              usersMap[profile.id] = profile.name;
            });
          }
          
          // Adicionar nome do solicitante aos pedidos
          const requestsWithNames = data.map(req => ({
            ...req,
            solicitante_nome: usersMap[req.solicitante_id] || 'Usuário desconhecido'
          }));
          
          setRequests(requestsWithNames);
        }
      } catch (error) {
        console.error("Erro ao buscar requisições:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);

  if (loading) {
    return <div>Carregando requisições...</div>;
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Requisições de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma requisição encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar as requisições por status
  const pendingRequests = requests.filter(req => req.status === 'pendente');
  const approvedRequests = requests.filter(req => req.status === 'aprovada');
  const otherRequests = requests.filter(req => !['pendente', 'aprovada'].includes(req.status));

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-100">
          <CardHeader className="bg-yellow-50/50">
            <CardTitle>Requisições Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.solicitante_nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.data_solicitacao)}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  
                  {(user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'estoque') && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Recusar
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <p className="text-sm">
                    <span className="font-medium">De:</span> {getLocationName(request.origem)}{' '}
                    <span className="font-medium">Para:</span> {getLocationName(request.destino)}
                  </p>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium">Itens:</p>
                    <ul className="text-sm pl-5 list-disc">
                      {request.itens.map((item, idx) => (
                        <li key={idx}>
                          {getProductName(item.produto)}: {item.quantidade} unidade(s)
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {request.observacoes && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Observações:</p>
                      <p className="text-sm">{request.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {approvedRequests.length > 0 && (
        <Card className="border-blue-100">
          <CardHeader className="bg-blue-50/50">
            <CardTitle>Requisições Aprovadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvedRequests.map((request) => (
              <div key={request.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.solicitante_nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.data_solicitacao)}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => handleComplete(request.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Confirmar Entrega
                  </Button>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm">
                    <span className="font-medium">De:</span> {getLocationName(request.origem)}{' '}
                    <span className="font-medium">Para:</span> {getLocationName(request.destino)}
                  </p>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium">Itens:</p>
                    <ul className="text-sm pl-5 list-disc">
                      {request.itens.map((item, idx) => (
                        <li key={idx}>
                          {getProductName(item.produto)}: {item.quantidade} unidade(s)
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {request.observacoes && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Observações:</p>
                      <p className="text-sm">{request.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {otherRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Requisições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherRequests.map((request) => (
              <div key={request.id} className="border rounded-md p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{request.solicitante_nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.data_solicitacao)}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm">
                    <span className="font-medium">De:</span> {getLocationName(request.origem)}{' '}
                    <span className="font-medium">Para:</span> {getLocationName(request.destino)}
                  </p>
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium">Itens:</p>
                    <ul className="text-sm pl-5 list-disc">
                      {request.itens.map((item, idx) => (
                        <li key={idx}>
                          {getProductName(item.produto)}: {item.quantidade} unidade(s)
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {request.observacoes && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Observações:</p>
                      <p className="text-sm">{request.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
