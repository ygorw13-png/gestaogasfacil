
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { InventoryMovement } from "../../types/cashierTypes";

interface MovementsListProps {
  movements: InventoryMovement[];
}

export function MovementsList({ movements }: MovementsListProps) {
  const getProductName = (code: string): string => {
    switch (code) {
      case "P13": return "GLP P13";
      case "P20": return "GLP P20";
      case "P45": return "GLP P45";
      case "water": return "Água 20L";
      default: return code;
    }
  };

  return (
    <div className="max-h-48 overflow-y-auto space-y-2">
      {movements.slice().reverse().map((movement, index) => (
        <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/40">
          <div className="flex items-center">
            {movement.type === "loan" ? (
              <ArrowUpFromLine className="h-4 w-4 mr-2 text-red-500" />
            ) : (
              <ArrowDownToLine className="h-4 w-4 mr-2 text-green-500" />
            )}
            <div>
              <span className="font-medium">{getProductName(movement.product)}</span>
              <span> - {movement.quantity} unidade(s)</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            {new Date(movement.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
