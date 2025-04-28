import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Trash } from "lucide-react";
import { customTables } from "@/integrations/supabase/customClient";

interface StockRequestProps {
  onRequestCreated: () => void;
}

type LocationType = "portaria" | "rota" | "estoque";

export function StockRequest({ onRequestCreated }: StockRequestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [origem, setOrigem] = useState<LocationType>("portaria");
  const [destino, setDestino] = useState<LocationType>("estoque");
  const [observacoes, setObservacoes] = useState<string>("");
  const [itens, setItens] = useState<Array<{ produto: string; quantidade: number }>>([
    { produto: "P13", quantidade: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddItem = () => {
    setItens([...itens, { produto: "P13", quantidade: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'produto' | 'quantidade', value: string | number) => {
    const newItens = [...itens];
    newItens[index] = {
      ...newItens[index],
      [field]: field === 'quantidade' ? Number(value) : value
    };
    setItens(newItens);
  };

  const validateForm = () => {
    if (!origem) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a origem",
        variant: "destructive"
      });
      return false;
    }
    
    if (!destino) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o destino",
        variant: "destructive"
      });
      return false;
    }
    
    if (origem === destino) {
      toast({
        title: "Erro",
        description: "Origem e destino devem ser diferentes",
        variant: "destructive"
      });
      return false;
    }
    
    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item",
        variant: "destructive"
      });
      return false;
    }
    
    for (let i = 0; i < itens.length; i++) {
      if (!itens[i].produto) {
        toast({
          title: "Campo obrigatório",
          description: `Selecione o produto no item ${i + 1}`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!itens[i].quantidade || itens[i].quantidade <= 0) {
        toast({
          title: "Quantidade inválida",
          description: `A quantidade deve ser maior que 0 no item ${i + 1}`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await customTables.stockRequests.insert({
        solicitante_id: user?.id,
        status: 'pendente',
        itens,
        observacoes,
        origem,
        destino
      });
        
      if (error) throw error;
      
      toast({
        title: "Requisição criada",
        description: "Sua requisição de estoque foi enviada com sucesso"
      });
      
      onRequestCreated();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Requisição de Estoque</CardTitle>
        <CardDescription>
          Solicite transferência de produtos entre setores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Origem</label>
            <Select value={origem} onValueChange={(value: LocationType) => setOrigem(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portaria">Portaria</SelectItem>
                <SelectItem value="rota">Rota</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Destino</label>
            <Select value={destino} onValueChange={(value: LocationType) => setDestino(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portaria">Portaria</SelectItem>
                <SelectItem value="rota">Rota</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Itens</label>
            <Button type="button" variant="outline" onClick={handleAddItem} size="sm">
              Adicionar Item
            </Button>
          </div>
          
          {itens.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Select 
                value={item.produto} 
                onValueChange={(value) => handleItemChange(index, 'produto', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P13">GLP P13</SelectItem>
                  <SelectItem value="P20">GLP P20</SelectItem>
                  <SelectItem value="P45">GLP P45</SelectItem>
                  <SelectItem value="agua">Água 20L</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                type="number"
                value={item.quantidade}
                onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                placeholder="Quantidade" 
                min="1"
                className="w-24"
              />
              
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveItem(index)}
                disabled={itens.length === 1}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Observações</label>
          <Textarea 
            placeholder="Informações adicionais sobre a requisição..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>
        
        <Button 
          type="button" 
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Enviando..." : "Enviar Requisição"}
        </Button>
      </CardContent>
    </Card>
  );
}
