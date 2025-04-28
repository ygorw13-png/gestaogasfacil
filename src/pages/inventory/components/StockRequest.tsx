
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";

interface StockRequestProps {
  onRequestCreated: () => void;
}

interface RequestItem {
  id: string;
  product: string;
  quantity: number;
}

export function StockRequest({ onRequestCreated }: StockRequestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [origem, setOrigem] = useState<string>("estoque");
  const [destino, setDestino] = useState<string>("portaria");
  const [observacoes, setObservacoes] = useState<string>("");
  const [items, setItems] = useState<RequestItem[]>([
    { id: "1", product: "P13", quantity: 1 }
  ]);

  const handleAddItem = () => {
    const newId = String(items.length + 1);
    setItems([...items, { id: newId, product: "P13", quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: 'product' | 'quantity', value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    
    if (origem === destino) {
      toast({
        title: "Erro",
        description: "Origem e destino não podem ser os mesmos",
        variant: "destructive"
      });
      return;
    }
    
    if (items.some(item => item.quantity <= 0)) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('requisicoes_estoque')
        .insert({
          solicitante_id: user.id,
          status: 'pendente',
          itens: items.map(item => ({ 
            produto: item.product, 
            quantidade: item.quantity 
          })),
          observacoes,
          origem,
          destino
        });
      
      if (error) throw error;
      
      toast({
        title: "Requisição enviada",
        description: "Sua requisição foi enviada com sucesso"
      });
      
      // Reset form
      setObservacoes("");
      setItems([{ id: "1", product: "P13", quantity: 1 }]);
      
      // Callback
      onRequestCreated();
      
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

  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle>Nova Requisição de Estoque</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select 
                value={origem} 
                onValueChange={setOrigem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estoque">Estoque Central</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="rota">Rota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select 
                value={destino} 
                onValueChange={setDestino}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estoque">Estoque Central</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="rota">Rota</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Itens</Label>
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-2 my-2">
                <Select
                  value={item.product}
                  onValueChange={(value) => handleItemChange(item.id, 'product', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o produto" />
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
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre esta requisição"
              className="resize-none"
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Requisição"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
