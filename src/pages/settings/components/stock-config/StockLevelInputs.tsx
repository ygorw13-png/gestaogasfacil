
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
    onSettingsChange({
      ...settings,
      [field]: parseInt(e.target.value) || 0
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Estoque Mínimo P13</label>
          <Input 
            type="number" 
            value={settings.p13Min}
            onChange={handleNumberChange('p13Min')}
            min={0}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estoque Mínimo P20</label>
          <Input 
            type="number" 
            value={settings.p20Min}
            onChange={handleNumberChange('p20Min')}
            min={0}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estoque Mínimo P45</label>
          <Input 
            type="number" 
            value={settings.p45Min}
            onChange={handleNumberChange('p45Min')}
            min={0}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estoque Mínimo Água</label>
          <Input 
            type="number" 
            value={settings.aguaMin}
            onChange={handleNumberChange('aguaMin')}
            min={0}
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="enableAlerts"
          checked={settings.alertsEnabled}
          onCheckedChange={(checked) => onSettingsChange({...settings, alertsEnabled: checked})}
          disabled={disabled}
        />
        <Label htmlFor="enableAlerts" className="text-sm font-medium">
          Habilitar alertas de estoque mínimo
        </Label>
      </div>
    </div>
  );
}
