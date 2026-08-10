
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CylinderMovementProps {
  loanGas: boolean;
  cylinderMovement: 'none' | 'loan' | 'return';
  movementQuantity: number;
  onLoanGasChange: (checked: boolean) => void;
  onCylinderMovementChange: (value: 'none' | 'loan' | 'return') => void;
  onMovementQuantityChange: (value: number) => void;
}

export function CylinderMovement({
  loanGas,
  cylinderMovement,
  movementQuantity,
  onLoanGasChange,
  onCylinderMovementChange,
  onMovementQuantityChange,
}: CylinderMovementProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="loanGas"
          checked={loanGas}
          onCheckedChange={(checked) => onLoanGasChange(!!checked)}
        />
        <Label htmlFor="loanGas" className="text-sm font-normal">
          Empréstimo de casco (cliente não está devolvendo casco vazio)
        </Label>
      </div>

      {loanGas && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-amber-800 text-sm">
            Empréstimo de casco registrado. Um casco vazio ficará pendente para este cliente.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Label>Movimentação de Vasilhame</Label>
        <RadioGroup
          value={cylinderMovement}
          onValueChange={(value) => onCylinderMovementChange(value as 'none' | 'loan' | 'return')}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none">Troca — cliente entregou o vasilhame vazio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="loan" id="loan" />
            <Label htmlFor="loan">Empréstimo de vasilhame (cliente leva o casco)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="return" id="return" />
            <Label htmlFor="return">Devolução extra de vasilhames</Label>
          </div>
        </RadioGroup>
      </div>

      {cylinderMovement !== 'none' && (
        <div className="space-y-2">
          <Label htmlFor="movementQuantity">Quantidade de vasilhames</Label>
          <Input
            type="number"
            id="movementQuantity"
            value={movementQuantity}
            onChange={(e) => onMovementQuantityChange(Number(e.target.value))}
            min={1}
          />
        </div>
      )}

      {cylinderMovement === 'loan' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-amber-800 text-sm">
            Empréstimo de {movementQuantity} vasilhame(s) será registrado para este cliente.
          </p>
        </div>
      )}
    </div>
  );
}
