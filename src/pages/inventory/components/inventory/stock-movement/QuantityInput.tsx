
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { StockMovementFormValues } from "./types";

interface QuantityInputProps {
  form: UseFormReturn<StockMovementFormValues>;
  loading: boolean;
}

export function QuantityInput({ form, loading }: QuantityInputProps) {
  return (
    <FormField
      control={form.control}
      name="quantity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Quantidade</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              {...field} 
              min={1}
              disabled={loading}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
