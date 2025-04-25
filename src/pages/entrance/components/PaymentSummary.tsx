
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentSummaryProps } from "../types/cashierTypes";

export const PaymentSummary = ({ data, formatCurrency, formatQuantities }: PaymentSummaryProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Valores Recebidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cashAmount">Dinheiro</Label>
          <Input 
            id="cashAmount" 
            value={`R$ ${formatCurrency(data.cash)} (${formatQuantities(data.quantities.cash)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditAmount">Cartão de Crédito</Label>
          <Input 
            id="creditAmount" 
            value={`R$ ${formatCurrency(data.credit)} (${formatQuantities(data.quantities.credit)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debitAmount">Cartão de Débito</Label>
          <Input 
            id="debitAmount" 
            value={`R$ ${formatCurrency(data.debit)} (${formatQuantities(data.quantities.debit)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pixAmount">PIX</Label>
          <Input 
            id="pixAmount" 
            value={`R$ ${formatCurrency(data.pix)} (${formatQuantities(data.quantities.pix)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promissoryAmount">Promissórias</Label>
          <Input 
            id="promissoryAmount" 
            value={`R$ ${formatCurrency(data.promissory)} (${formatQuantities(data.quantities.promissory)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gasVoucherAmount">Vale Gás</Label>
          <Input 
            id="gasVoucherAmount" 
            value={`R$ ${formatCurrency(data.gasVoucher)} (${formatQuantities(data.quantities.gasVoucher)})`}
            readOnly
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-secondary rounded-md p-3 w-full sm:w-64">
          <div className="flex justify-between font-medium">
            <span>Total em Sistema:</span>
            <span>R$ {formatCurrency(data.totalSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Conferido:</span>
            <span>R$ {formatCurrency(data.totalSales)}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t">
            <span>Diferença:</span>
            <span className="text-green-600 font-medium">R$ 0,00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
