
import { useEffect, useMemo, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { AlertTriangle, UserCheck } from "lucide-react";
import { Control, useFormState, useFormContext } from "react-hook-form";
import { FormValues } from "../types/formTypes";
import { supabase } from "@/integrations/supabase/client";

interface ClientFormSectionProps {
  control: Control<FormValues>;
}

interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  address: any;
}

export function ClientFormSection({ control }: ClientFormSectionProps) {
  const { errors } = useFormState({ control });
  const { setValue, watch } = useFormContext<FormValues>();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [openField, setOpenField] = useState<"name" | "phone" | null>(null);
  const [matchedClient, setMatchedClient] = useState<string | null>(null);

  const clientName = watch("clientName");
  const clientPhone = watch("clientPhone");

  useEffect(() => {
    let active = true;
    supabase
      .from("clients")
      .select("id, name, phone, address")
      .order("name")
      .then(({ data }) => {
        if (active && data) setClients(data as ClientRow[]);
      });
    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!openField) return [];
    const term = (openField === "name" ? clientName : clientPhone || "").trim().toLowerCase();
    if (term.length < 2) return [];
    return clients
      .filter((c) =>
        openField === "name"
          ? c.name?.toLowerCase().includes(term)
          : (c.phone || "").replace(/\D/g, "").includes(term.replace(/\D/g, ""))
      )
      .slice(0, 6);
  }, [openField, clientName, clientPhone, clients]);

  const applyClient = (client: ClientRow) => {
    const addr = client.address || {};
    setValue("clientName", client.name || "", { shouldValidate: true });
    setValue("clientPhone", (client.phone || "").replace(/\D/g, "").substring(0, 11), { shouldValidate: true });
    setValue("street", addr.street || "", { shouldValidate: true });
    setValue("number", addr.number || "", { shouldValidate: true });
    setValue("complement", addr.complement || "");
    setValue("neighborhood", addr.neighborhood || "");
    setMatchedClient(client.name);
    setOpenField(null);
  };

  const hasErrors = !!errors.clientName || !!errors.clientPhone || !!errors.street || !!errors.number;

  // Função para formatar número de telefone
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não for dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = cleaned.substring(0, 11);
    
    return limited;
  };

  const SuggestionList = ({ field }: { field: "name" | "phone" }) =>
    openField === field && suggestions.length > 0 ? (
      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
        {suggestions.map((c) => (
          <button
            key={c.id}
            type="button"
            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
            onMouseDown={(e) => {
              e.preventDefault();
              applyClient(c);
            }}
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-xs text-muted-foreground">
              {c.phone || "sem telefone"}
              {c.address?.street ? ` • ${c.address.street}, ${c.address.number || "s/n"}` : ""}
            </span>
          </button>
        ))}
      </div>
    ) : null;


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

      {matchedClient && (
        <Alert className="mb-2">
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            Cliente <strong>{matchedClient}</strong> encontrado — dados preenchidos automaticamente.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="clientName"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome do cliente" 
                  autoComplete="off"
                  {...field} 
                  onChange={(e) => {
                    // Sanitiza a entrada limitando a 100 caracteres
                    const sanitized = e.target.value.substring(0, 100);
                    field.onChange(sanitized);
                    setMatchedClient(null);
                    setOpenField("name");
                  }}
                  onFocus={() => setOpenField("name")}
                  onBlur={() => {
                    field.onBlur();
                    setTimeout(() => setOpenField((f) => (f === "name" ? null : f)), 120);
                  }}
                />
              </FormControl>
              <SuggestionList field="name" />
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Telefone *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Somente números" 
                  maxLength={11}
                  autoComplete="off"
                  {...field} 
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    field.onChange(formattedValue);
                    setMatchedClient(null);
                    setOpenField("phone");
                  }}
                  onFocus={() => setOpenField("phone")}
                  onBlur={() => {
                    field.onBlur();
                    setTimeout(() => setOpenField((f) => (f === "phone" ? null : f)), 120);
                  }}
                />
              </FormControl>
              <SuggestionList field="phone" />
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
