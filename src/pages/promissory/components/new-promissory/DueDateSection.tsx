
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DueDateSectionProps {
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
}

export function DueDateSection({ dueDate, setDueDate }: DueDateSectionProps) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="due-date" className="text-right">
        Data de Vencimento
      </Label>
      <div className="col-span-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="due-date"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dueDate ? (
                format(dueDate, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
