
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserRole } from "@/types/userTypes";

interface InventoryHeaderProps {
  userRole?: UserRole;
  onNewRequestClick: () => void;
}

export function InventoryHeader({ userRole, onNewRequestClick }: InventoryHeaderProps) {
  const canCreateRequest = userRole === 'admin' || 
                           userRole === 'gerente' || 
                           userRole === 'estoque' || 
                           userRole === 'portaria';
                           
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
      <h1 className="text-3xl font-bold tracking-tight">
        Gerenciamento de Estoque
      </h1>
      
      {canCreateRequest && (
        <Button
          onClick={onNewRequestClick}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Nova Requisição
        </Button>
      )}
    </div>
  );
}
