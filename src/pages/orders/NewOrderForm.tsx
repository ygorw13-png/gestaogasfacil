import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from "./types";

const formSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientPhone: z.string().min(1, "Telefone é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
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
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
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
    const hasProducts = values.gasP13 || values.gasP20 || values.gasP45 || values.water;
    
    if (!hasProducts) {
      toast.error("Selecione pelo menos um produto");
      return;
    }
    
    let product = "";
    let quantity = 0;
    
    if (values.gasP13 && values.gasP13 > 0) {
      product = "Gás P13";
      quantity = values.gasP13;
    } else if (values.gasP20 && values.gasP20 > 0) {
      product = "Gás P20";
      quantity = values.gasP20;
    } else if (values.gasP45 && values.gasP45 > 0) {
      product = "Gás P45";
      quantity = values.gasP45;
    } else if (values.water && values.water > 0) {
      product = "Água";
      quantity = values.water;
    }
    
    const order: Order = {
      id: (Math.random() * 1000).toFixed(0),
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      address: {
        street: values.street,
        number: values.number,
        complement: values.complement,
        neighborhood: values.neighborhood,
      },
      product,
      quantity,
      price: 0,
      hasEmptyCylinder: true,
      isCompletePackage: false,
      createdAt: new Date(),
      status: "pending",
      notes: values.observations
    };
    
    onSubmit(order);
    form.reset();
    setHasGasP13(false);
    setHasGasP20(false);
    setHasGasP45(false);
    setHasWater(false);
  };

  return (
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
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
        
        <div className="flex justify-end gap-4">
          <Button type="submit">
            Cadastrar Pedido
          </Button>
        </div>
      </form>
    </Form>
  );
}
