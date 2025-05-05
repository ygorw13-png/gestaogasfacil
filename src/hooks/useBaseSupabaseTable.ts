
import { ValidTableName } from "@/services/supabaseService";
import { useTableCRUD } from "./supabase";

/**
 * @deprecated Use useTableCRUD or specific hooks from /hooks/supabase instead
 * Legacy hook maintained for backward compatibility
 */
export function useBaseSupabaseTable<T extends Record<string, any>>(
  tableName: ValidTableName,
  options: {
    idField?: string;
    defaultErrorMessage?: string;
    defaultSuccessMessage?: string;
    showToasts?: boolean;
  } = {}
) {
  const {
    idField = 'id',
    defaultErrorMessage = "Ocorreu um erro na operação",
    defaultSuccessMessage = "Operação realizada com sucesso",
    showToasts = true
  } = options;

  // Use our new TableCRUD hook
  const {
    data,
    loading,
    error,
    fetchData,
    getById,
    addItem,
    updateItem,
    deleteItem,
    refresh
  } = useTableCRUD<T>(tableName, {
    idField,
    toastMessages: {
      fetchError: defaultErrorMessage,
      createSuccess: defaultSuccessMessage,
      updateSuccess: defaultSuccessMessage,
      deleteSuccess: defaultSuccessMessage
    }
  });

  return {
    data,
    loading,
    error,
    fetchData,
    getById,
    addItem,
    updateItem,
    deleteItem,
    refresh
  };
}
