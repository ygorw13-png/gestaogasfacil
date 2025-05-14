
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InventoryItem, InventoryMovement } from "@/hooks/supabase/useInventory";
import { StockMovementFormValues, stockMovementSchema } from "./types";

export function useStockMovementForm(
  onSubmitCallback: (movement: InventoryMovement) => Promise<boolean>,
  inventoryItems: InventoryItem[]
) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      product: inventoryItems.length > 0 ? inventoryItems[0].product : "",
      type: "entrada",
      quantity: 1,
      notes: "",
    },
  });

  const handleSubmit = async (values: StockMovementFormValues) => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      const movement: InventoryMovement = {
        product: values.product,
        type: values.type,
        quantity: values.quantity,
        notes: values.notes,
        created_at: new Date().toISOString(),
      };
      
      const result = await onSubmitCallback(movement);
      
      if (result) {
        setSuccess(true);
        form.reset({
          product: inventoryItems[0]?.product || "",
          type: "entrada",
          quantity: 1,
          notes: "",
        });
        
        // Esconde a mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Não foi possível registrar a movimentação");
      }
      
    } catch (err: any) {
      setError(err.message || "Erro ao registrar movimentação");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    success,
    error,
    setError,
    handleSubmit: form.handleSubmit(handleSubmit),
  };
}
