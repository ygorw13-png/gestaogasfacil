
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface StockConfigActionsProps {
  onSave: () => void;
  saving: boolean;
}

export function StockConfigActions({ onSave, saving }: StockConfigActionsProps) {
  return (
    <Button 
      onClick={onSave} 
      disabled={saving}
      className="mt-4 w-full sm:w-auto"
    >
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </>
      )}
    </Button>
  );
}
