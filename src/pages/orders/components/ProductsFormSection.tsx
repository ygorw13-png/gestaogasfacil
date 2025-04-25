
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { FormValues } from "../types/formTypes";

interface ProductsFormSectionProps {
  control: Control<FormValues>;
  hasGasP13: boolean;
  hasGasP20: boolean;
  hasGasP45: boolean;
  hasWater: boolean;
  onToggleProduct: (product: 'gasP13' | 'gasP20' | 'gasP45' | 'water', value: boolean) => void;
}

export function ProductsFormSection({
  control,
  hasGasP13,
  hasGasP20,
  hasGasP45,
  hasWater,
  onToggleProduct
}: ProductsFormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Produtos</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ProductInput
          control={control}
          name="gasP13"
          label="Gás P13"
          isEnabled={hasGasP13}
          onToggle={(checked) => onToggleProduct('gasP13', checked)}
        />
        
        <ProductInput
          control={control}
          name="gasP20"
          label="Gás P20"
          isEnabled={hasGasP20}
          onToggle={(checked) => onToggleProduct('gasP20', checked)}
        />
        
        <ProductInput
          control={control}
          name="gasP45"
          label="Gás P45"
          isEnabled={hasGasP45}
          onToggle={(checked) => onToggleProduct('gasP45', checked)}
        />
        
        <ProductInput
          control={control}
          name="water"
          label="Água"
          isEnabled={hasWater}
          onToggle={(checked) => onToggleProduct('water', checked)}
        />
      </div>
    </div>
  );
}

interface ProductInputProps {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
}

function ProductInput({ control, name, label, isEnabled, onToggle }: ProductInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium" htmlFor={name}>
          {label}
        </label>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
      </div>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                type="number"
                min="0"
                disabled={!isEnabled}
                value={isEnabled ? field.value : 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
