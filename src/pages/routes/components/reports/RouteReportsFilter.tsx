
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { mockDrivers } from "../../data/mockRouteReports";

interface RouteReportsFilterProps {
  startDate: string;
  endDate: string;
  driverId: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDriverIdChange: (id: string) => void;
  onGenerateReport: () => void;
}

export function RouteReportsFilter({
  startDate,
  endDate,
  driverId,
  onStartDateChange,
  onEndDateChange,
  onDriverIdChange,
  onGenerateReport
}: RouteReportsFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Relatório de Rotas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
          
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
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
