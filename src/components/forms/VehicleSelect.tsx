
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  mileage?: number;
}

interface VehicleSelectProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  vehicles: Vehicle[];
  onVehicleChange?: (vehicleId: string, vehicle: Vehicle | undefined) => void;
  placeholder?: string;
}

export function VehicleSelect({ 
  form, 
  name, 
  label = "Veículo",
  vehicles,
  onVehicleChange,
  placeholder = "Selecione o veículo"
}: VehicleSelectProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select 
            onValueChange={(value) => {
              field.onChange(value);
              if (onVehicleChange) {
                const vehicle = vehicles.find(v => v.id === value);
                onVehicleChange(value, vehicle);
              }
            }} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {vehicles.map((vehicle) => (
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
  );
}
