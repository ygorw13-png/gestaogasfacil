
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NewMaintenanceForm from "./forms/NewMaintenanceForm";
import UpcomingMaintenance from "./maintenance/UpcomingMaintenance";
import CompletedMaintenance from "./maintenance/CompletedMaintenance";
import MaintenanceHistory from "./maintenance/MaintenanceHistory";
import { useFleet } from "../context/FleetContext";

export default function MaintenanceSchedule() {
  const [open, setOpen] = useState(false);
  const { maintenances, addMaintenance } = useFleet();
  
  const handleMaintenanceSuccess = () => {
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Manutenção</DialogTitle>
              </DialogHeader>
              <NewMaintenanceForm onSuccess={handleMaintenanceSuccess} />
            </DialogContent>
          </Dialog>
        </div>
        
        <TabsContent value="upcoming">
          <Card>
            <CardContent className="pt-6">
              <UpcomingMaintenance maintenances={maintenances.filter(m => 
                m.status === "scheduled" || m.status === "in-progress"
              )} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardContent className="pt-6">
              <CompletedMaintenance maintenances={maintenances.filter(m => 
                m.status === "completed"
              )} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <MaintenanceHistory maintenances={maintenances} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
