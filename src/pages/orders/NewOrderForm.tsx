
// Vamos corrigir o erro de build relacionado à propriedade className no Select
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from "./types";

const formSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientPhone: z.string().min(1, "Telefone é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  reference: z.string().optional(),
  gasP13: z.number().min(0, "Não pode ser negativo").optional(),
  gasP20: z.number().min(0, "Não pode ser negativo").optional(),
  gasP45: z.number().min(0, "Não pode ser negativo").optional(),
  water: z.number().min(0, "Não pode ser negativo").optional(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  observations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewOrderFormProps {
  onSubmit: (order: Order) => void;
}

export default function NewOrderForm({ onSubmit }: NewOrderFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      address: "",
      reference: "",
      gasP13: 0,
      gasP20: 0,
      gasP45: 0,
      water: 0,
      paymentMethod: "",
      observations: "",
    },
  });

  const [hasGasP13, setHasGasP13] = useState(false);
  const [hasGasP20, setHasGasP20] = useState(false);
  const [hasGasP45, setHasGasP45] = useState(false);
  const [hasWater, setHasWater] = useState(false);

  const handleSubmit = (values: FormValues) => {
    // Validação adicional para garantir que pelo menos um produto foi selecionado
    const hasProducts = values.gasP13 || values.gasP20 || values.gasP45 || values.water;
    
    if (!hasProducts) {
      toast.error("Selecione pelo menos um produto");
      return;
    }
    
    const order: Order = {
      id: "", // Será gerado no backend
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      address: values.address,
      reference: values.reference || "",
      products: {
        gasP13: values.gasP13 || 0,
        gasP20: values.gasP20 || 0,
        gasP45: values.gasP45 || 0,
        water: values.water || 0,
      },
      paymentMethod: values.paymentMethod,
      observations: values.observations || "",
      status: "pending",
      createdAt: new Date(),
    };
    
    onSubmit(order);
    form.reset();
    setHasGasP13(false);
    setHasGasP20(false);
    setHasGasP45(false);
    setHasWater(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Novo Pedido</CardTitle>
        <CardDescription>Cadastre um novo pedido de gás ou água</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados do Cliente</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponto de Referência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ponto de referência (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Produtos</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" htmlFor="gasP13">
                      Gás P13
                    </label>
                    <input
                      type="checkbox"
                      checked={hasGasP13}
                      onChange={(e) => {
                        setHasGasP13(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue("gasP13", 0);
                        } else {
                          form.setValue("gasP13", 1);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="gasP13"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            disabled={!hasGasP13}
                            value={hasGasP13 ? field.value : 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Outros produtos seguem o mesmo padrão */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" htmlFor="gasP20">
                      Gás P20
                    </label>
                    <input
                      type="checkbox"
                      checked={hasGasP20}
                      onChange={(e) => {
                        setHasGasP20(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue("gasP20", 0);
                        } else {
                          form.setValue("gasP20", 1);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="gasP20"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            disabled={!hasGasP20}
                            value={hasGasP20 ? field.value : 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" htmlFor="gasP45">
                      Gás P45
                    </label>
                    <input
                      type="checkbox"
                      checked={hasGasP45}
                      onChange={(e) => {
                        setHasGasP45(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue("gasP45", 0);
                        } else {
                          form.setValue("gasP45", 1);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="gasP45"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            disabled={!hasGasP45}
                            value={hasGasP45 ? field.value : 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" htmlFor="water">
                      Água
                    </label>
                    <input
                      type="checkbox"
                      checked={hasWater}
                      onChange={(e) => {
                        setHasWater(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue("water", 0);
                        } else {
                          form.setValue("water", 1);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="water"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            disabled={!hasWater}
                            value={hasWater ? field.value : 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pagamento e Observações</h3>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="money">Dinheiro</SelectItem>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="promissory">Promissória</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre o pedido"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="px-0">
              <Button type="submit" className="ml-auto">
                Cadastrar Pedido
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
