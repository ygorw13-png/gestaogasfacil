
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { mockVehicles, mockMaintenances } from "../../data/mockData";

const maintenanceTypes = [
  { value: "oil-change", label: "Troca de Óleo" },
  { value: "brake-service", label: "Revisão de Freios" },
  { value: "tire-replacement", label: "Troca de Pneus" },
  { value: "periodic-review", label: "Revisão Periódica" },
  { value: "battery-replacement", label: "Troca de Bateria" },
  { value: "air-filter", label: "Filtro de Ar" },
  { value: "ac-service", label: "Ar Condicionado" },
  { value: "engine-repair", label: "Reparo do Motor" },
  { value: "electrical", label: "Sistema Elétrico" },
  { value: "other", label: "Outros" },
];

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  description: z.string().optional(),
  scheduledDate: z.date({
    required_error: "Data é obrigatória",
  }),
  estimatedCost: z.coerce.number().min(0, "Custo não pode ser negativo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

interface NewMaintenanceFormProps {
  onSuccess: () => void;
}

export default function NewMaintenanceForm({ onSuccess }: NewMaintenanceFormProps) {
  const form = useForm<z.infer<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: "",
      type: "",
      description: "",
      scheduledDate: new Date(),
      estimatedCost: 0,
      priority: "medium",
    },
  });

  const onSubmit = (data: z.infer<typeof maintenanceSchema>) => {
    // Em um ambiente real, enviaríamos para o backend
    const vehicle = mockVehicles.find(v => v.id === data.vehicleId);
    const typeLabel = maintenanceTypes.find(t => t.value === data.type)?.label || data.type;
    
    const newMaintenance = {
      id: `maintenance-${Date.now()}`,
      vehicleId: data.vehicleId,
      vehiclePlate: vehicle?.plate || 'Desconhecido',
      type: typeLabel,
      description: data.description || typeLabel,
      scheduledDate: data.scheduledDate,
      estimatedCost: data.estimatedCost,
      priority: data.priority,
      status: "scheduled",
      mileage: vehicle?.mileage || 0,
    };
    
    mockMaintenances.push(newMaintenance);
    
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Veículo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model}
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
              <FormLabel>Tipo de Manutenção</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva detalhes da manutenção" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Agendada</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estimatedCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo Estimado (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">Agendar</Button>
        </div>
      </form>
    </Form>
  );
}
