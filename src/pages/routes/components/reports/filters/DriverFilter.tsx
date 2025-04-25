
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDrivers } from "../../../data/mockRouteReports";

interface DriverFilterProps {
  driverId: string;
  onDriverIdChange: (id: string) => void;
}

export function DriverFilter({ driverId, onDriverIdChange }: DriverFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="driverId">Motorista</Label>
      <Select value={driverId} onValueChange={onDriverIdChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um motorista" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Motoristas</SelectItem>
          {mockDrivers.map((driver) => (
            <SelectItem key={driver.id} value={driver.id}>
              {driver.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
