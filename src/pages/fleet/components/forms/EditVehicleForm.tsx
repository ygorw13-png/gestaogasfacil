
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { mockVehicles } from "../../data/mockData";

const vehicleSchema = z.object({
  id: z.string(),
  plate: z.string().min(7, "A placa deve ter no mínimo 7 caracteres").max(8, "A placa deve ter no máximo 8 caracteres"),
  model: z.string().min(2, "O modelo deve ter no mínimo 2 caracteres"),
  year: z.coerce.number().min(1950, "O ano deve ser maior que 1950").max(new Date().getFullYear() + 1, "O ano não pode ser no futuro"),
  type: z.enum(["car", "truck", "van"]),
  mileage: z.coerce.number().min(0, "A quilometragem não pode ser negativa"),
  status: z.enum(["active", "maintenance", "inactive"]),
  lastMaintenance: z.string().nullable(),
});

interface EditVehicleFormProps {
  vehicle: any;
  onSuccess: () => void;
}

export default function EditVehicleForm({ vehicle, onSuccess }: EditVehicleFormProps) {
  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      id: vehicle.id,
      plate: vehicle.plate,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type,
      mileage: vehicle.mileage,
      status: vehicle.status,
      lastMaintenance: vehicle.lastMaintenance,
    },
  });

  const onSubmit = (data: z.infer<typeof vehicleSchema>) => {
    // Em um ambiente real, enviaríamos para o backend
    // Por enquanto, apenas simulamos a atualização
    const vehicleIndex = mockVehicles.findIndex(v => v.id === data.id);
    
    if (vehicleIndex !== -1) {
      mockVehicles[vehicleIndex] = {
        ...mockVehicles[vehicleIndex],
        ...data
      };
    }
    
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <input type="hidden" {...field} />
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="car">Carro</SelectItem>
                    <SelectItem value="truck">Caminhão</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem Atual</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="maintenance">Em Manutenção</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">Atualizar</Button>
        </div>
      </form>
    </Form>
  );
}
