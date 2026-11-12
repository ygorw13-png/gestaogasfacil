
import { Button } from "@/components/ui/button";
import { FileText, Bell, UserPlus } from "lucide-react";

interface ClientsHeaderProps {
  onNewClient: () => void;
  onOpenAlerts: () => void;
  onGenerateReport: () => void;
  alertCount: number;
}

export function ClientsHeader({ 
  onNewClient, 
  onOpenAlerts, 
  onGenerateReport, 
  alertCount 
}: ClientsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onGenerateReport} variant="outline" className="flex items-center gap-2">
          <FileText size={16} />
          <span>Relatório</span>
        </Button>
        <Button 
          onClick={onOpenAlerts} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={alertCount === 0}
        >
          <Bell size={16} />
          <span>Alertas</span>
          {alertCount > 0 && (
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {alertCount}
            </span>
          )}
        </Button>
        <Button onClick={onNewClient} className="flex items-center gap-2">
          <UserPlus size={16} />
          <span>Novo Cliente</span>
        </Button>
      </div>
    </div>
  );
}
