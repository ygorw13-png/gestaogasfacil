
import React, { useEffect } from "react";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { AlertBar } from "@/components/ui/AlertBar";
import { StockMovementFormProps } from "./types";
import { ProductSelect } from "./ProductSelect";
import { MovementTypeSelect } from "./MovementTypeSelect";
import { QuantityInput } from "./QuantityInput";
import { NotesInput } from "./NotesInput";
import { FormSubmitButton } from "./FormSubmitButton";
import { useStockMovementForm } from "./useStockMovementForm";

export function StockMovementForm({ onSubmit, inventoryItems }: StockMovementFormProps) {
  const {
    form,
    loading,
    success,
    error,
    setError,
    handleSubmit
  } = useStockMovementForm(onSubmit, inventoryItems);

  // Update product selection when inventory items change
  useEffect(() => {
    if (inventoryItems.length > 0 && !form.getValues().product) {
      form.setValue("product", inventoryItems[0].product);
    }
  }, [inventoryItems, form]);

  return (
    <Card>
      <CardContent className="pt-6">
        {success && (
          <AlertBar
            variant="success"
            message="Movimentação registrada com sucesso!"
            className="mb-4"
            hideAfter={3000}
          />
        )}
        
        {error && (
          <AlertBar
            variant="danger"
            message={error}
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}
        
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProductSelect 
                form={form} 
                inventoryItems={inventoryItems} 
                loading={loading} 
              />
              
              <MovementTypeSelect 
                form={form} 
                loading={loading} 
              />
              
              <QuantityInput 
                form={form} 
                loading={loading} 
              />
            </div>
            
            <NotesInput 
              form={form} 
              loading={loading} 
            />
            
            <div className="flex justify-end">
              <FormSubmitButton loading={loading} />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
