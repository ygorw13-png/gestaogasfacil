
import { useState, useEffect } from "react";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { AlertBar } from "@/components/ui/AlertBar";
import { InventoryMovement, InventoryItem } from "@/hooks/supabase/useInventory";
import { Loader2 } from "lucide-react";

const stockMovementSchema = z.object({
  product: z.string({
    required_error: "O produto é obrigatório",
  }),
  type: z.enum(["entrada", "saída", "ajuste"], {
    required_error: "O tipo de movimentação é obrigatório",
  }),
  quantity: z.coerce
    .number()
    .min(1, "A quantidade deve ser maior que 0")
    .max(1000, "A quantidade deve ser menor que 1000"),
  notes: z.string().optional(),
});

type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

interface StockMovementFormProps {
  onSubmit: (movement: InventoryMovement) => Promise<boolean>;
  inventoryItems: InventoryItem[];
}

export function StockMovementForm({ onSubmit, inventoryItems }: StockMovementFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      product: "",
      type: "entrada",
      quantity: 1,
      notes: "",
    },
  });

  useEffect(() => {
    // Automaticamente seta o primeiro produto da lista como padrão
    if (inventoryItems.length > 0 && !form.getValues().product) {
      form.setValue("product", inventoryItems[0].product);
    }
  }, [inventoryItems, form]);

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
      
      const result = await onSubmit(movement);
      
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimentação</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saída">Saída</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>
            
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
            
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  "Registrar Movimentação"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
