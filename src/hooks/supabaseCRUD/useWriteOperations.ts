
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { SupabaseOperationOptions } from "./types";
import { useErrorHandling } from "./useErrorHandling";
import { safeTypeConversion } from "@/services/supabase/utils/typeConversions";

/**
 * Hook providing write operations for a Supabase table
 */
export function useWriteOperations<T>(tableName: ValidTableName) {
  const { safeExecute, handleSuccess } = useErrorHandling();

  // Create a new record with explicit typing
  const create = useCallback(async (
    data: Record<string, unknown>,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { successMessage = `Item adicionado com sucesso`, idField = 'id' } = options || {};
    
    const result = await safeExecute(async () => {
      // Use type assertion to prevent TypeScript errors with Supabase
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select() // Select the item inserted
        .single();  // We expect only one result
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return insertedData;
    }, `Não foi possível adicionar o item em ${tableName}`);
    
    // Use shared type conversion utility
    return safeTypeConversion<T>(result);
  }, [tableName, safeExecute, handleSuccess]);

  // Update a record with explicit typing
  const update = useCallback(async (
    id: string, 
    data: Record<string, unknown>,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { successMessage = `Item atualizado com sucesso`, idField = 'id' } = options || {};
    
    const result = await safeExecute(async () => {
      // First do the update
      const { error: updateError } = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated item
      const { data: updatedData, error: fetchError } = await (supabase
        .from(tableName) as any)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      if (!updatedData) throw new Error(`Registro não encontrado após atualização`);
      
      handleSuccess(successMessage);
      return updatedData;
    }, `Não foi possível atualizar o item em ${tableName}`);
    
    // Use shared type conversion utility
    return safeTypeConversion<T>(result);
  }, [tableName, safeExecute, handleSuccess]);

  // Delete a record
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ): Promise<boolean> => {
    const { successMessage = `Item excluído com sucesso`, idField = 'id' } = options || {};
    
    const success = await safeExecute(async () => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    }, `Não foi possível excluir o item de ${tableName}`);
    
    return success || false;
  }, [tableName, safeExecute, handleSuccess]);

  return {
    create,
    update,
    remove
  };
}
