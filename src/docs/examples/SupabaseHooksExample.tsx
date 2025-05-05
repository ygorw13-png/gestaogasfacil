
import React, { useState } from 'react';
import { useSupabaseTable } from '@/services/supabase/hooks';
import { useSupabaseCRUD } from '@/hooks/useSupabaseCRUD';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Example type definition
interface StockItem {
  id: string;
  produto: string;
  estoque_minimo: number;
  alerta_ativo: boolean;
}

export function SupabaseHooksExample() {
  // Example 1: Using useSupabaseTable for state management
  const {
    data: stockItems,
    loading: tableLoading,
    error: tableError,
    createRecord,
    updateRecord,
    deleteRecord
  } = useSupabaseTable<StockItem>('configuracoes_estoque', {
    fetchOnMount: true,
    toastMessages: {
      createSuccess: 'Item adicionado com sucesso',
      updateSuccess: 'Item atualizado com sucesso',
      deleteSuccess: 'Item removido com sucesso'
    }
  });

  // Example 2: Using useSupabaseCRUD for more direct control
  const {
    getAll,
    getById,
    create,
    update,
    remove,
    loading: crudLoading
  } = useSupabaseCRUD<StockItem>('configuracoes_estoque');

  // Component state
  const [newItemName, setNewItemName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<StockItem | null>(null);

  // Example of creating an item with useSupabaseTable
  const handleCreateItem = () => {
    if (!newItemName) return;
    
    createRecord({
      id: newItemName.toLowerCase().replace(/\s+/g, '_'),
      produto: newItemName,
      estoque_minimo: 10,
      alerta_ativo: true
    });
    
    setNewItemName('');
  };

  // Example of fetching a single item with useSupabaseCRUD
  const handleFetchDetail = async (id: string) => {
    const result = await getById(id);
    if (result.data) {
      setDetailItem(result.data);
      setSelectedItemId(id);
    }
  };

  // Example of updating an item
  const handleToggleAlert = (id: string, currentStatus: boolean) => {
    updateRecord(id, { alerta_ativo: !currentStatus });
  };

  // Example of deleting an item
  const handleDeleteItem = (id: string) => {
    deleteRecord(id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setDetailItem(null);
    }
  };

  if (tableLoading) return <LoadingSpinner />;
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
              <h3 className="text-lg font-medium mb-4">Items (useSupabaseTable)</h3>
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
              <h3 className="text-lg font-medium mb-4">Detalhes (useSupabaseCRUD)</h3>
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
