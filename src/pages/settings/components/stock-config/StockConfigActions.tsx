
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StockConfigActionsProps {
  onSave: () => void;
  saving: boolean;
}

export function StockConfigActions({ onSave, saving }: StockConfigActionsProps) {
  return (
    <Button 
      onClick={onSave} 
      disabled={saving}
      className="mt-4"
    >
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar Configurações"
      )}
    </Button>
  );
}
