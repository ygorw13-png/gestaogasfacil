
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface StockUpdateFormProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  onUpdateStock: (newStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  }) => Promise<void>;
}

export function StockUpdateForm({ currentStock, onUpdateStock }: StockUpdateFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [stockValues, setStockValues] = useState({
    p13: currentStock.p13,
    p20: currentStock.p20,
    p45: currentStock.p45,
    water: currentStock.water
  });

  const handleInputChange = (field: keyof typeof stockValues, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setStockValues(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async () => {
    // Verificar se o usuário tem permissão para atualizar estoque
    if (!user || !['admin', 'gerente', 'estoque'].includes(user.role)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para atualizar o estoque",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateStock(stockValues);
      
      toast({
        title: "Estoque atualizado",
        description: "Níveis de estoque atualizados com sucesso"
      });
      
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atualização de Estoque</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="p13-stock">GLP P13</Label>
            <Input
              id="p13-stock"
              type="number"
              min="0"
              value={stockValues.p13}
              onChange={(e) => handleInputChange('p13', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="p20-stock">GLP P20</Label>
            <Input
              id="p20-stock"
              type="number"
              min="0"
              value={stockValues.p20}
              onChange={(e) => handleInputChange('p20', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="p45-stock">GLP P45</Label>
            <Input
              id="p45-stock"
              type="number"
              min="0"
              value={stockValues.p45}
              onChange={(e) => handleInputChange('p45', e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="water-stock">Água 20L</Label>
            <Input
              id="water-stock"
              type="number"
              min="0"
              value={stockValues.water}
              onChange={(e) => handleInputChange('water', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Atualizar Estoque
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
