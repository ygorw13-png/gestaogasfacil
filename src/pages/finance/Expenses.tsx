import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, FileMinus, FilePlus, Car, Wrench } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import FuelExpenses from "./components/FuelExpenses";
import MaintenanceExpenses from "./components/MaintenanceExpenses";
import MiscExpenses from "./components/MiscExpenses";
import FixedExpenses from "./components/FixedExpenses";

const toISO = (d?: Date) => (d ? d.toLocaleDateString("en-CA") : undefined);

export default function Expenses() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });

  const range = useMemo(
    () => ({ from: toISO(dateRange?.from), to: toISO(dateRange?.to ?? dateRange?.from) }),
    [dateRange]
  );

  const isToday = range.from === toISO(new Date()) && range.to === toISO(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            disabled={isToday}
            onClick={() => {
              const d = new Date();
              setDateRange({ from: d, to: d });
            }}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Hoje
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {isToday
          ? "Mostrando apenas as despesas de hoje"
          : `Período: ${range.from ?? "-"} até ${range.to ?? "-"}`}
      </p>

      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Combustível
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Manutenção
          </TabsTrigger>
          <TabsTrigger value="misc" className="flex items-center gap-2">
            <FileMinus className="h-4 w-4" />
            Diversas
          </TabsTrigger>
          <TabsTrigger value="fixed" className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            Fixas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel">
          <FuelExpenses range={range} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceExpenses range={range} />
        </TabsContent>

        <TabsContent value="misc">
          <MiscExpenses range={range} />
        </TabsContent>

        <TabsContent value="fixed">
          <FixedExpenses range={range} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
