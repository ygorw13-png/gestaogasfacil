
import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangeFilterProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Selecionar data";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      onStartDateChange(date.toISOString().split('T')[0]);
      setStartOpen(false);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      onEndDateChange(date.toISOString().split('T')[0]);
      setEndOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Data Inicial</label>
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateDisplay(startDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate ? new Date(startDate) : undefined}
              onSelect={handleStartDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Data Final</label>
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateDisplay(endDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate ? new Date(endDate) : undefined}
              onSelect={handleEndDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
