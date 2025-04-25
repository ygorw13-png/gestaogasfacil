
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { FormValues } from "../types/formTypes";

interface ClientFormSectionProps {
  control: Control<FormValues>;
}

export function ClientFormSection({ control }: ClientFormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dados do Cliente</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="Telefone do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rua</FormLabel>
              <FormControl>
                <Input placeholder="Nome da rua" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input placeholder="Número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="complement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder="Complemento (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input placeholder="Bairro (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
