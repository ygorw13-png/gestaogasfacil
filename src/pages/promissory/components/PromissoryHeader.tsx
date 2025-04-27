
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PromissoryReportButton } from "./PromissoryReportButton";
import { PromissoryNote } from "../types";

interface PromissoryHeaderProps {
  filteredNotes: PromissoryNote[];
  selectedStatus: string;
  onNewPromissory: () => void;
}

export function PromissoryHeader({ 
  filteredNotes, 
  selectedStatus,
  onNewPromissory 
}: PromissoryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Gestão de Promissórias</h1>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={onNewPromissory}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Promissória
        </Button>
        
        <PromissoryReportButton 
          promissories={filteredNotes}
          statusFilter={selectedStatus !== "all" ? selectedStatus : undefined}
        />
      </div>
    </div>
  );
}
