
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, FileMinus, FilePlus, Car, Wrench } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { addDays } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import FuelExpenses from "./components/FuelExpenses";
import MaintenanceExpenses from "./components/MaintenanceExpenses";
import MiscExpenses from "./components/MiscExpenses";
import FixedExpenses from "./components/FixedExpenses";

export default function Expenses() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>
      
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
          <FuelExpenses dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceExpenses dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="misc">
          <MiscExpenses dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="fixed">
          <FixedExpenses dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
