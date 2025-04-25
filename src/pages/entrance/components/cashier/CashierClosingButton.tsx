
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface CashierClosingButtonProps {
  onClick?: () => void;
}

export function CashierClosingButton({ onClick }: CashierClosingButtonProps) {
  return (
    <Button variant="outline" className="flex items-center gap-2" onClick={onClick}>
      <CheckCircle size={16} />
      <span>Fechar Caixa</span>
    </Button>
  );
}
