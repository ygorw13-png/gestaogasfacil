
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useFleet } from "../../context/FleetContext";
import { VehicleSelect } from "./fuel-entry/VehicleSelect";
import { FuelDetails } from "./fuel-entry/FuelDetails";
import { fuelSchema, type FuelFormData } from "./schemas/fuelEntrySchema";

interface NewFuelEntryFormProps {
  onSuccess: () => void;
}

export default function NewFuelEntryForm({ onSuccess }: NewFuelEntryFormProps) {
  const [totalCost, setTotalCost] = useState(0);
  const { vehicles, addFuelEntry } = useFleet();

  const form = useForm<FuelFormData>({
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

  const updateTotalCost = (liters: number, pricePerLiter: number) => {
    setTotalCost(liters * pricePerLiter);
  };

  const onSubmit = async (data: FuelFormData) => {
    const vehicle = vehicles.find(v => v.id === data.vehicleId);
    await addFuelEntry({
      vehiclePlate: vehicle?.plate || "",
      date: (data.date instanceof Date ? data.date : new Date(data.date)).toISOString().split("T")[0],
      mileage: data.mileage,
      fuelType: data.fuelType,
      liters: data.liters,
      cost: data.liters * data.pricePerLiter,
      notes: data.station || undefined,
    });
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VehicleSelect form={form} />

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

        <FuelDetails form={form} onValuesChange={updateTotalCost} />

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
