
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, FileMinus, FilePlus, Car, Wrench, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import FuelExpenses from "./components/FuelExpenses";
import MaintenanceExpenses from "./components/MaintenanceExpenses";
import MiscExpenses from "./components/MiscExpenses";
import FixedExpenses from "./components/FixedExpenses";

export default function Expenses() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('daily')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Diário
          </Button>
          <Button
            variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('weekly')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Semanal
          </Button>
          <Button
            variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('monthly')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Mensal
          </Button>
        </div>
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
          <FuelExpenses period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceExpenses period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="misc">
          <MiscExpenses period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="fixed">
          <FixedExpenses period={selectedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
