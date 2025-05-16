
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VehiclesList from "./components/VehiclesList";
import VehicleAssignments from "./components/VehicleAssignments";
import MaintenanceSchedule from "./components/MaintenanceSchedule";
import FuelTracking from "./components/FuelTracking";
import VehicleExpenses from "./components/VehicleExpenses";
import { FleetProvider } from "./context/FleetContext";

export default function Fleet() {
  return (
    <FleetProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Frota</h1>
        </div>
        
        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vehicles">Veículos</TabsTrigger>
            <TabsTrigger value="assignments">Atribuições</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenções</TabsTrigger>
            <TabsTrigger value="fuel">Abastecimentos</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="vehicles">
            <VehiclesList />
          </TabsContent>
          <TabsContent value="assignments">
            <VehicleAssignments />
          </TabsContent>
          <TabsContent value="maintenance">
            <MaintenanceSchedule />
          </TabsContent>
          <TabsContent value="fuel">
            <FuelTracking />
          </TabsContent>
          <TabsContent value="expenses">
            <VehicleExpenses />
          </TabsContent>
        </Tabs>
      </div>
    </FleetProvider>
  );
}
