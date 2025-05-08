
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSupabaseCRUD } from '@/hooks/useSupabaseCRUD';

// Example type definition
interface StockItem {
  id: string;
  produto: string;
  estoque_minimo: number;
  alerta_ativo: boolean;
}

export function SupabaseHooksExample() {
  // Example using useSupabaseCRUD hook
  const {
    loading: tableLoading,
    error: tableError,
    create,
    update,
    remove,
    getAll
  } = useSupabaseCRUD('configuracoes_estoque');

  // State for data management
  const [stockItems, setStockItems] = useState<Record<string, any>[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<StockItem | null>(null);

  // Fetch data on component mount
  React.useEffect(() => {
    const fetchStockItems = async () => {
      const result = await getAll();
      if (Array.isArray(result)) {
        setStockItems(result);
      }
    };
    
    fetchStockItems();
  }, [getAll]);

  // Example of creating an item
  const handleCreateItem = async () => {
    if (!newItemName) return;
    
    const newItem = {
      produto: newItemName,
      estoque_minimo: 10,
      alerta_ativo: true,
      atualizado_por: 'system',
      atualizado_em: new Date().toISOString()
    };
    
    const result = await create(newItem);
    
    if (result && !(result instanceof Error)) {
      setStockItems([...stockItems, result]);
      setNewItemName('');
    }
  };

  // Example of fetching a single item
  const handleFetchDetail = async (id: string) => {
    const result = await getAll({
      filters: { id }
    });
    
    if (Array.isArray(result) && result.length > 0) {
      setDetailItem(result[0] as StockItem);
      setSelectedItemId(id);
    }
  };

  // Example of updating an item
  const handleToggleAlert = async (id: string, currentStatus: boolean) => {
    const updateData = {
      alerta_ativo: !currentStatus,
      atualizado_por: 'system',
      atualizado_em: new Date().toISOString()
    };
    
    const result = await update(id, updateData);
    
    if (result && !(result instanceof Error)) {
      setStockItems(prevItems => 
        prevItems.map(item => item.id === id ? result : item)
      );
    }
  };

  // Example of deleting an item
  const handleDeleteItem = async (id: string) => {
    const success = await remove(id);
    
    // Fixed: proper type checking for success value
    if (success && !(success instanceof Error)) {
      setStockItems(prevItems => prevItems.filter(item => item.id !== id));
      if (selectedItemId === id) {
        setSelectedItemId(null);
        setDetailItem(null);
      }
    }
  };

  if (tableLoading && stockItems.length === 0) return <LoadingSpinner />;
  if (tableError) return <div>Error: {tableError.message}</div>;

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Hooks Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do novo item"
            />
            <Button onClick={handleCreateItem}>Adicionar Item</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Items</h3>
              {stockItems.length === 0 ? (
                <p className="text-muted-foreground">Nenhum item encontrado</p>
              ) : (
                <ul className="space-y-2">
                  {stockItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <span>{item.produto}</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFetchDetail(item.id)}
                        >
                          Detalhes
                        </Button>
                        <Button 
                          variant={item.alerta_ativo ? "default" : "secondary"} 
                          size="sm"
                          onClick={() => handleToggleAlert(item.id, item.alerta_ativo)}
                        >
                          {item.alerta_ativo ? 'Alerta On' : 'Alerta Off'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Detalhes</h3>
              {detailItem ? (
                <div className="space-y-3">
                  <p><strong>ID:</strong> {detailItem.id}</p>
                  <p><strong>Produto:</strong> {detailItem.produto}</p>
                  <p><strong>Estoque Mínimo:</strong> {detailItem.estoque_minimo}</p>
                  <p><strong>Alerta Ativo:</strong> {detailItem.alerta_ativo ? 'Sim' : 'Não'}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Selecione um item para ver os detalhes</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
