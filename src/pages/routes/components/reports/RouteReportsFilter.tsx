
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { DateRangeFilter } from "./filters/DateRangeFilter";
import { DriverFilter } from "./filters/DriverFilter";

interface RouteReportsFilterProps {
  startDate: string;
  endDate: string;
  driverId: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDriverIdChange: (id: string) => void;
  onGenerateReport: () => void;
  isGeneratingReport?: boolean;
}

export function RouteReportsFilter({
  startDate,
  endDate,
  driverId,
  onStartDateChange,
  onEndDateChange,
  onDriverIdChange,
  onGenerateReport,
  isGeneratingReport = false
}: RouteReportsFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Relatório de Rotas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
          <DriverFilter
            driverId={driverId}
            onDriverIdChange={onDriverIdChange}
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
