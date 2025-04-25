
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentSummaryProps } from "../types/cashierTypes";
import { formatCurrency, formatQuantities } from "@/lib/formatUtils";

export const PaymentSummary = ({ 
  data, 
  formatCurrency: customFormatCurrency = formatCurrency, 
  formatQuantities: customFormatQuantities = formatQuantities 
}: PaymentSummaryProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Valores Recebidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cashAmount">Dinheiro</Label>
          <Input 
            id="cashAmount" 
            value={`R$ ${customFormatCurrency(data.cash)} (${customFormatQuantities(data.quantities.cash)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditAmount">Cartão de Crédito</Label>
          <Input 
            id="creditAmount" 
            value={`R$ ${customFormatCurrency(data.credit)} (${customFormatQuantities(data.quantities.credit)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debitAmount">Cartão de Débito</Label>
          <Input 
            id="debitAmount" 
            value={`R$ ${customFormatCurrency(data.debit)} (${customFormatQuantities(data.quantities.debit)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pixAmount">PIX</Label>
          <Input 
            id="pixAmount" 
            value={`R$ ${customFormatCurrency(data.pix)} (${customFormatQuantities(data.quantities.pix)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promissoryAmount">Promissórias</Label>
          <Input 
            id="promissoryAmount" 
            value={`R$ ${customFormatCurrency(data.promissory)} (${customFormatQuantities(data.quantities.promissory)})`}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gasVoucherAmount">Vale Gás</Label>
          <Input 
            id="gasVoucherAmount" 
            value={`R$ ${customFormatCurrency(data.gasVoucher)} (${customFormatQuantities(data.quantities.gasVoucher)})`}
            readOnly
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-secondary rounded-md p-3 w-full sm:w-64">
          <div className="flex justify-between font-medium">
            <span>Total em Sistema:</span>
            <span>R$ {customFormatCurrency(data.totalSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Conferido:</span>
            <span>R$ {customFormatCurrency(data.totalSales)}</span>
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
