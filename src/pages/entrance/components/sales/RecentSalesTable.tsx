
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Sale {
  id: number | string;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  amount: number;
}

interface RecentSalesTableProps {
  sales: Sale[];
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  const navigate = useNavigate();
  
  const handleViewAllSales = () => {
    navigate("/entrance/sales");
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left font-medium py-2">Horário</th>
            <th className="text-left font-medium py-2">Cliente</th>
            <th className="text-left font-medium py-2">Produto</th>
            <th className="text-center font-medium py-2">Qtd</th>
            <th className="text-left font-medium py-2">Pagamento</th>
            <th className="text-right font-medium py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id} className="border-b">
              <td className="py-2">{sale.time}</td>
              <td className="py-2">{sale.client}</td>
              <td className="py-2">{sale.product}</td>
              <td className="py-2 text-center">{sale.quantity}</td>
              <td className="py-2">{sale.payment}</td>
              <td className="py-2 text-right">R$ {sale.amount.toFixed(2).replace('.', ',')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-center">
        <Button variant="outline" size="sm" onClick={handleViewAllSales}>
          Ver todas as vendas
        </Button>
      </div>
    </div>
  );
}
