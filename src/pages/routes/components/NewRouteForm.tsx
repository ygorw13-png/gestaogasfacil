
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { RouteFormValues } from '../types';
import { Separator } from '@/components/ui/separator';

// Mock drivers data
const mockDrivers = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Pedro Santos" },
  { id: "3", name: "Carlos Ferreira" },
  { id: "4", name: "André Oliveira" },
];

// Mock promissory notes data
const mockPromissoryNotes = [
  { id: "1", clientName: "Maria Silva", amount: 150.00, dueDate: "2025-05-01" },
  { id: "2", clientName: "José Santos", amount: 200.00, dueDate: "2025-05-05" },
  { id: "3", clientName: "Ana Oliveira", amount: 180.00, dueDate: "2025-05-10" },
];

// Schema for validation
const formSchema = z.object({
  driverId: z.string().min(1, "Selecione um motorista"),
  destination: z.string().min(3, "Destino deve ter pelo menos 3 caracteres"),
  departureTime: z.string().min(1, "Informe o horário de saída"),
  inventory: z.object({
    gasP13: z.number().min(0, "Quantidade não pode ser negativa"),
    gasP20: z.number().min(0, "Quantidade não pode ser negativa"),
    gasP45: z.number().min(0, "Quantidade não pode ser negativa"),
    water: z.number().min(0, "Quantidade não pode ser negativa"),
  }),
  promissoryNotesToCollect: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export function NewRouteForm() {
  const { toast } = useToast();

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: "",
      destination: "",
      departureTime: "",
      inventory: {
        gasP13: 0,
        gasP20: 0,
        gasP45: 0,
        water: 0,
      },
      promissoryNotesToCollect: [],
      notes: "",
    },
  });

  function onSubmit(values: RouteFormValues) {
    console.log("Form values:", values);
    
    toast({
      title: "Rota criada com sucesso!",
      description: `Rota para ${values.destination} com o motorista ${
        mockDrivers.find(d => d.id === values.driverId)?.name
      } foi criada.`,
    });

    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Rota de Entrega</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
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
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Povoado Santa Maria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departureTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Saída *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-lg font-medium mb-4">Inventário de Saída</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="inventory.gasP13"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Botijões P13 (Cheios)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventory.gasP20"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Botijões P20 (Cheios)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventory.gasP45"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Botijões P45 (Cheios)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventory.water"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Água (Galões)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-lg font-medium mb-4">Notas Promissórias a Receber</h3>
              <div className="space-y-4">
                <div className="grid gap-4">
                  {mockPromissoryNotes.map((note) => (
                    <div key={note.id} className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="promissoryNotesToCollect"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value.includes(note.id)}
                                onChange={(e) => {
                                  const updatedValue = e.target.checked
                                    ? [...field.value, note.id]
                                    : field.value.filter((id) => id !== note.id);
                                  field.onChange(updatedValue);
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </FormControl>
                            <div className="text-sm">
                              <p className="font-medium">{note.clientName}</p>
                              <p className="text-muted-foreground">
                                R$ {note.amount.toFixed(2)} - Vence: {new Date(note.dueDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a rota"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Limpar
              </Button>
              <Button type="submit">Iniciar Nova Rota</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
