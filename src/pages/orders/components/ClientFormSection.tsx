
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { Control, useFormState } from "react-hook-form";
import { FormValues } from "../types/formTypes";

interface ClientFormSectionProps {
  control: Control<FormValues>;
}

export function ClientFormSection({ control }: ClientFormSectionProps) {
  const { errors } = useFormState({ control });
  
  const hasErrors = !!errors.clientName || !!errors.clientPhone || !!errors.street || !!errors.number;

  // Função para formatar número de telefone
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não for dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = cleaned.substring(0, 11);
    
    return limited;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dados do Cliente</h3>
      
      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Por favor, preencha todos os campos obrigatórios corretamente.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome do cliente" 
                  {...field} 
                  onChange={(e) => {
                    // Sanitiza a entrada limitando a 100 caracteres
                    const sanitized = e.target.value.substring(0, 100);
                    field.onChange(sanitized);
                  }}
                />
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
              <FormLabel>Telefone *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Somente números" 
                  maxLength={11}
                  {...field} 
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    field.onChange(formattedValue);
                  }}
                />
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
              <FormLabel>Rua *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome da rua" 
                  {...field} 
                  onChange={(e) => {
                    // Sanitiza a entrada limitando a 100 caracteres
                    const sanitized = e.target.value.substring(0, 100);
                    field.onChange(sanitized);
                  }}
                />
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
              <FormLabel>Número *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Número" 
                  {...field} 
                  onChange={(e) => {
                    // Sanitiza a entrada limitando a 10 caracteres
                    const sanitized = e.target.value.substring(0, 10);
                    field.onChange(sanitized);
                  }}
                />
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
                <Input 
                  placeholder="Complemento (opcional)" 
                  {...field} 
                  onChange={(e) => {
                    // Sanitiza a entrada limitando a 50 caracteres
                    const sanitized = e.target.value.substring(0, 50);
                    field.onChange(sanitized);
                  }}
                />
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
                <Input 
                  placeholder="Bairro (opcional)" 
                  {...field}
                  onChange={(e) => {
                    // Sanitiza a entrada limitando a 50 caracteres
                    const sanitized = e.target.value.substring(0, 50);
                    field.onChange(sanitized);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
