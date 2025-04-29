
import React from 'react';
import { Label } from "@/components/ui/label";
import { ColaboradorSelect } from "@/components/inputs/ColaboradorSelect";

interface DriverFilterProps {
  driverId: string;
  onDriverIdChange: (id: string) => void;
}

export function DriverFilter({ driverId, onDriverIdChange }: DriverFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="driverId">Motorista</Label>
      <ColaboradorSelect 
        value={driverId} 
        onValueChange={onDriverIdChange}
        cargo="Motorista"
        placeholder="Selecione um motorista"
      />
    </div>
  );
}
