
import { Loader2 } from "lucide-react";
import { AlertBar } from "@/components/ui/AlertBar";
import { StockLevelInputs } from "./StockLevelInputs";
import { StockConfigActions } from "./StockConfigActions";

interface StockConfigurationContentProps {
  loading: boolean;
  saving: boolean;
  success: boolean;
  error: string | null;
  storeSettings: import("./StockLevelInputs").StockSettings;
  onSettingsChange: (settings: import("./StockLevelInputs").StockSettings) => void;
  onSave: () => void;
  onErrorDismiss: () => void;
}

export function StockConfigurationContent({
  loading,
  saving,
  success,
  error,
  storeSettings,
  onSettingsChange,
  onSave,
  onErrorDismiss
}: StockConfigurationContentProps) {
  return (
    <div className="space-y-4">
      {success && (
        <AlertBar
          variant="success"
          message="Configurações de estoque salvas com sucesso!"
          hideAfter={5000}
        />
      )}
      
      {error && (
        <AlertBar
          variant="danger"
          message={error}
          onClose={onErrorDismiss}
        />
      )}
    
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <StockLevelInputs 
            settings={storeSettings} 
            onSettingsChange={onSettingsChange} 
            disabled={saving}
          />
          
          <StockConfigActions 
            onSave={onSave} 
            saving={saving} 
          />
        </>
      )}
    </div>
  );
}
