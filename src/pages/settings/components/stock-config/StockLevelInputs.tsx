
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface StockSettings {
  p13Min: number;
  p20Min: number;
  p45Min: number;
  aguaMin: number;
  alertsEnabled: boolean;
}

interface StockLevelInputsProps {
  settings: StockSettings;
  onSettingsChange: (settings: StockSettings) => void;
  disabled?: boolean;
}

export function StockLevelInputs({ 
  settings, 
  onSettingsChange, 
  disabled = false 
}: StockLevelInputsProps) {
  const handleNumberChange = (field: keyof Omit<StockSettings, 'alertsEnabled'>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Converter explicitamente para número e garantir valor mínimo de 0
    const value = parseInt(e.target.value, 10);
    const numValue = isNaN(value) ? 0 : Math.max(0, value);
    
    onSettingsChange({
      ...settings,
      [field]: numValue
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="p13Min" className="font-medium">Estoque Mínimo P13</Label>
          <Input 
            id="p13Min"
            type="number" 
            value={settings.p13Min}
            onChange={handleNumberChange('p13Min')}
            min={0}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p20Min" className="font-medium">Estoque Mínimo P20</Label>
          <Input 
            id="p20Min"
            type="number" 
            value={settings.p20Min}
            onChange={handleNumberChange('p20Min')}
            min={0}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p45Min" className="font-medium">Estoque Mínimo P45</Label>
          <Input 
            id="p45Min"
            type="number" 
            value={settings.p45Min}
            onChange={handleNumberChange('p45Min')}
            min={0}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aguaMin" className="font-medium">Estoque Mínimo Água</Label>
          <Input 
            id="aguaMin"
            type="number" 
            value={settings.aguaMin}
            onChange={handleNumberChange('aguaMin')}
            min={0}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2 pt-2">
        <Switch 
          id="enableAlerts"
          checked={settings.alertsEnabled}
          onCheckedChange={(checked) => onSettingsChange({...settings, alertsEnabled: checked})}
          disabled={disabled}
        />
        <Label htmlFor="enableAlerts" className="font-medium">
          Habilitar alertas de estoque mínimo
        </Label>
      </div>
    </div>
  );
}
