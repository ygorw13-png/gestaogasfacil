
import { DollarSign, CreditCard, FileText } from "lucide-react";

interface PaymentType {
  type: string;
  amount: number;
  icon: JSX.Element;
}

interface PaymentsByTypeProps {
  payments: PaymentType[];
}

export function PaymentsByType({ payments }: PaymentsByTypeProps) {
  return (
    <div className="space-y-4">
      {payments.map((item, index) => (
        <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
          <div className="flex items-center gap-2">
            {item.icon}
            <span>{item.type}</span>
          </div>
          <div className="font-medium">
            R$ {item.amount.toFixed(2).replace('.', ',')}
          </div>
        </div>
      ))}
    </div>
  );
}
