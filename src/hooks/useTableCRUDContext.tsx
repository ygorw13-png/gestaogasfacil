
import { ReactNode, createContext, useContext, useState } from 'react';
import { useTableCRUD } from './supabaseCRUD';
import { ValidTableName } from '@/services/supabase/types';

interface TableCRUDProviderProps<T extends Record<string, any>> {
  tableName: ValidTableName;
  children: ReactNode;
}

interface TableCRUDContextType<T extends Record<string, any>> {
  data: T[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  add: (item: Partial<T>) => Promise<T | null>;
  update: (id: string, updates: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
}

const TableCRUDContext = createContext<TableCRUDContextType<any> | null>(null);

export function TableCRUDProvider<T extends Record<string, any>>({ 
  tableName,
  children 
}: TableCRUDProviderProps<T>) {
  const { 
    getAll,
    create,
    update,
    remove,
    loading,
    error
  } = useTableCRUD<T>(tableName);

  const [data, setData] = useState<T[]>([]);

  const reload = async () => {
    const result = await getAll();
    if (result) {
      setData(result);
    }
  };

  const add = async (item: Partial<T>): Promise<T | null> => {
    const result = await create(item as any);
    if (result) {
      setData(prevData => [...prevData, result]);
      return result;
    }
    return null;
  };

  const updateItem = async (id: string, updates: Partial<T>): Promise<T | null> => {
    const result = await update(id, updates as any);
    if (result) {
      setData(prevData => prevData.map(item => 
        (item as any).id === id ? result : item
      ));
      return result;
    }
    return null;
  };

  const removeItem = async (id: string): Promise<boolean> => {
    const success = await remove(id);
    if (success) {
      setData(prevData => prevData.filter(item => (item as any).id !== id));
    }
    return success;
  };

  const value = {
    data,
    loading,
    error,
    reload,
    add,
    update: updateItem,
    remove: removeItem
  };

  return (
    <TableCRUDContext.Provider value={value}>
      {children}
    </TableCRUDContext.Provider>
  );
}

export function useTableCRUDContext<T extends Record<string, any>>() {
  const context = useContext(TableCRUDContext);
  if (!context) {
    throw new Error('useTableCRUDContext must be used within a TableCRUDProvider');
  }
  return context as TableCRUDContextType<T>;
}
