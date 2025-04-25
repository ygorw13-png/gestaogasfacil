
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VehiclesList from "./components/VehiclesList";
import VehicleAssignments from "./components/VehicleAssignments";

export default function Fleet() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Frota</h1>
      </div>
      
      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
          <TabsTrigger value="assignments">Atribuições</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles">
          <VehiclesList />
        </TabsContent>
        <TabsContent value="assignments">
          <VehicleAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
