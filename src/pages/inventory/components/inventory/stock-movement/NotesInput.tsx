
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { StockMovementFormValues } from "./types";

interface NotesInputProps {
  form: UseFormReturn<StockMovementFormValues>;
  loading: boolean;
}

export function NotesInput({ form, loading }: NotesInputProps) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações</FormLabel>
          <FormControl>
            <Textarea 
              {...field}
              placeholder="Observações sobre esta movimentação de estoque"
              disabled={loading}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
