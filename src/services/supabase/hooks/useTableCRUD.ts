
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse, ValidTableName } from "../types";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";
import { createSuccessResponse, createErrorResponse } from "../utils";

/**
 * Hook for performing CRUD operations on a table
 */
export function useTableCRUD(
  tableName: ValidTableName,
  options: {
    idField?: string;
    toastMessages?: {
      createSuccess?: string;
      createError?: string;
      updateSuccess?: string;
      updateError?: string;
      deleteSuccess?: string;
      deleteError?: string;
      fetchItemError?: string;
    };
  } = {}
) {
  const {
    idField = 'id',
    toastMessages = {}
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Using type Record<string, any> to avoid recursive type instantiation
  const getById = useCallback(async (id: string | number): Promise<ApiResponse<Record<string, any>>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      return createSuccessResponse(data || null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      return createErrorResponse(
        error, 
        toastMessages.fetchItemError || `Error fetching ${tableName} with id ${id}`
      );
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, toastMessages.fetchItemError]);

  // Using type Record<string, any> to avoid recursive type instantiation
  const createRecord = useCallback(async (record: Record<string, any>): Promise<ApiResponse<Record<string, any>>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      
      const successMsg = toastMessages.createSuccess || `${tableName} created successfully`;
      handleSuccess(successMsg);
      
      return createSuccessResponse(data || null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      handleError(
        error, 
        toastMessages.createError || `Error creating ${tableName}`
      );
      return createErrorResponse(error, `Error creating ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, toastMessages.createSuccess, toastMessages.createError, handleSuccess, handleError]);

  // Using type Record<string, any> to avoid recursive type instantiation
  const updateRecord = useCallback(async (
    id: string | number, 
    updates: Record<string, any>
  ): Promise<ApiResponse<Record<string, any>>> => {
    setLoading(true);
    setError(null);
    
    try {
      // First update
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated record
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      if (!data) {
        throw new Error(`Record not found after update: ${idField}=${id}`);
      }
      
      const successMsg = toastMessages.updateSuccess || `${tableName} updated successfully`;
      handleSuccess(successMsg);
      
      return createSuccessResponse(data);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      handleError(
        error, 
        toastMessages.updateError || `Error updating ${tableName}`
      );
      return createErrorResponse(error, `Error updating ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, toastMessages.updateSuccess, toastMessages.updateError, handleSuccess, handleError]);

  const deleteRecord = useCallback(async (id: string | number): Promise<ApiResponse<null>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      const successMsg = toastMessages.deleteSuccess || `${tableName} deleted successfully`;
      handleSuccess(successMsg);
      
      return createSuccessResponse(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      handleError(
        error, 
        toastMessages.deleteError || `Error deleting ${tableName}`
      );
      return createErrorResponse(error, `Error deleting ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, toastMessages.deleteSuccess, toastMessages.deleteError, handleSuccess, handleError]);

  return {
    loading,
    error,
    getById,
    createRecord,
    updateRecord,
    deleteRecord,
    resetError: () => setError(null)
  };
}
