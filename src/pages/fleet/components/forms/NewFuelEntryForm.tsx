
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { mockVehicles, mockFuelEntries } from "../../data/mockData";

const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  mileage: z.coerce.number().min(0, "Quilometragem não pode ser negativa"),
  fuelType: z.string().min(1, "Tipo de combustível é obrigatório"),
  liters: z.coerce.number().min(0, "Volume não pode ser negativo"),
  pricePerLiter: z.coerce.number().min(0, "Preço não pode ser negativo"),
  station: z.string().optional(),
  fullTank: z.boolean().default(true),
});

interface NewFuelEntryFormProps {
  onSuccess: () => void;
}

export default function NewFuelEntryForm({ onSuccess }: NewFuelEntryFormProps) {
  const [totalCost, setTotalCost] = useState(0);
  
  const form = useForm<z.infer<typeof fuelSchema>>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      vehicleId: "",
      date: new Date(),
      mileage: 0,
      fuelType: "",
      liters: 0,
      pricePerLiter: 0,
      station: "",
      fullTank: true,
    },
  });
  
  const watchLiters = form.watch("liters");
  const watchPricePerLiter = form.watch("pricePerLiter");
  
  // Atualiza o custo total quando os valores mudam
  useEffect(() => {
    const cost = watchLiters * watchPricePerLiter;
    setTotalCost(cost);
  }, [watchLiters, watchPricePerLiter]);

  const onSubmit = (data: z.infer<typeof fuelSchema>) => {
    // Em um ambiente real, enviaríamos para o backend
    const vehicle = mockVehicles.find(v => v.id === data.vehicleId);
    
    // Buscar última quilometragem para calcular consumo
    const lastEntry = [...mockFuelEntries]
      .filter(entry => entry.vehicleId === data.vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const previousMileage = lastEntry?.mileage || 0;
    
    const newEntry = {
      id: `fuel-${Date.now()}`,
      vehicleId: data.vehicleId,
      vehiclePlate: vehicle?.plate || 'Desconhecido',
      date: data.date,
      mileage: data.mileage,
      previousMileage: previousMileage,
      fuelType: data.fuelType,
      liters: data.liters,
      pricePerLiter: data.pricePerLiter,
      cost: data.liters * data.pricePerLiter,
      station: data.station || "Não informado",
      fullTank: data.fullTank,
    };
    
    mockFuelEntries.push(newEntry);
    
    // Atualizar quilometragem do veículo
    const vehicleIndex = mockVehicles.findIndex(v => v.id === data.vehicleId);
    if (vehicleIndex !== -1) {
      mockVehicles[vehicleIndex].mileage = data.mileage;
    }
    
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
              <Select onValueChange={(value) => {
                field.onChange(value);
                // Atualizar a quilometragem automaticamente se selecionarmos um veículo
                const vehicle = mockVehicles.find(v => v.id === value);
                if (vehicle) {
                  form.setValue("mileage", vehicle.mileage);
                }
              }} defaultValue={field.value}>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
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
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Combustível</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gasoline">Gasolina</SelectItem>
                    <SelectItem value="ethanol">Etanol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="diesel-s10">Diesel S10</SelectItem>
                    <SelectItem value="gasoline-aditivated">Gasolina Aditivada</SelectItem>
                    <SelectItem value="ethanol-aditivated">Etanol Aditivado</SelectItem>
                    <SelectItem value="gnv">GNV</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="station"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Posto</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do posto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="liters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Litros</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePerLiter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço por Litro (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="fullTank"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mr-2 h-4 w-4"
                  />
                </FormControl>
                <FormLabel className="m-0">Tanque cheio</FormLabel>
              </FormItem>
            )}
          />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-xl font-bold">R$ {totalCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
