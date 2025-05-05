
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { DateRangeFilter } from "./filters/DateRangeFilter";
import { DriverFilter } from "./filters/DriverFilter";

interface RouteReportsFilterProps {
  onFilterChange: (filters: {
    startDate: string;
    endDate: string;
    driverId: string;
  }) => void;
}

export function RouteReportsFilter({ onFilterChange }: RouteReportsFilterProps) {
  const todayDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [driverId, setDriverId] = useState("");

  const handleApplyFilters = () => {
    onFilterChange({
      startDate,
      endDate,
      driverId
    });
  };

  const handleResetFilters = () => {
    setStartDate(todayDate);
    setEndDate(todayDate);
    setDriverId("");
    
    onFilterChange({
      startDate: todayDate,
      endDate: todayDate,
      driverId: ""
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          
          <DriverFilter
            driverId={driverId}
            onDriverIdChange={setDriverId}
          />
          
          <div className="flex flex-col justify-end space-y-2">
            <Button onClick={handleApplyFilters}>
              <Search className="w-4 h-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Redefinir Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
