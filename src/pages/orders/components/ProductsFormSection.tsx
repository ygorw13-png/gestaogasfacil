
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { Control, useFormState } from "react-hook-form";
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
  const { errors } = useFormState({ control });
  
  const hasErrors = !!errors.gasP13 || !!errors.gasP20 || !!errors.gasP45 || !!errors.water;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Produtos</h3>
        {hasErrors && (
          <Alert variant="destructive" className="w-fit py-2 px-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Por favor, corrija as quantidades inválidas abaixo.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <FormField
        control={control}
        name="tipoVenda"
        render={({ field }) => (
          <FormItem className="max-w-md">
            <FormLabel>Tipo de venda</FormLabel>
            <Select value={field.value as string} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {TIPOS_VENDA.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TIPOS_VENDA.find((t) => t.value === field.value)?.description}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium" htmlFor={name}>
          {label}
        </label>
        <Checkbox
          id={`${name}-toggle`}
          checked={isEnabled}
          onCheckedChange={onToggle}
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
                max="99"
                disabled={!isEnabled}
                value={isEnabled ? field.value : 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
                className="text-lg"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
