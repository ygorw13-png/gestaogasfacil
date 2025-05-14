
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { SupabaseOperationOptions } from "./types";
import { useErrorHandling } from "./useErrorHandling";

/**
 * Hook providing write operations for a Supabase table
 */
export function useWriteOperations<T extends Record<string, any>>(tableName: ValidTableName) {
  const { safeExecute, handleSuccess } = useErrorHandling();

  // Create a new record with more explicit typing
  const create = useCallback(async (
    data: any,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { successMessage = "Item criado com sucesso" } = options || {};
    
    const result = await safeExecute<any>(async () => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return result;
    }, `Não foi possível criar o item em ${tableName}`);
    
    return result as T | null;
  }, [tableName, handleSuccess, safeExecute]);

  // Update an existing record
  const update = useCallback(async (
    id: string, 
    data: any, 
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { 
      successMessage = "Item atualizado com sucesso",
      idField = 'id'
    } = options || {};
    
    const result = await safeExecute<any>(async () => {
      // Executar a atualização
      const { error: updateError } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Buscar o registro atualizado
      const { data: updatedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
          
      if (fetchError) throw fetchError;
      
      if (!updatedData) {
        throw new Error(`Record not found after update: ${idField}=${id}`);
      }
      
      handleSuccess(successMessage);
      return updatedData;
    }, `Não foi possível atualizar o item em ${tableName}`);
    
    return result as T | null;
  }, [tableName, handleSuccess, safeExecute]);

  // Delete a record
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ): Promise<boolean> => {
    const { 
      successMessage = "Item excluído com sucesso",
      idField = 'id'
    } = options || {};
    
    const success = await safeExecute<boolean>(async () => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    }, `Não foi possível excluir o item de ${tableName}`);
    
    return success ?? false;
  }, [tableName, handleSuccess, safeExecute]);

  return {
    create,
    update,
    remove
  };
}
