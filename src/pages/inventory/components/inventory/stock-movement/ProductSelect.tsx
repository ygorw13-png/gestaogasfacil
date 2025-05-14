
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/hooks/supabase/useInventory";
import { UseFormReturn } from "react-hook-form";
import { StockMovementFormValues } from "./types";

interface ProductSelectProps {
  form: UseFormReturn<StockMovementFormValues>;
  inventoryItems: InventoryItem[];
  loading: boolean;
}

export function ProductSelect({ form, inventoryItems, loading }: ProductSelectProps) {
  return (
    <FormField
      control={form.control}
      name="product"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Produto</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
            disabled={loading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.product}>
                  {item.product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
