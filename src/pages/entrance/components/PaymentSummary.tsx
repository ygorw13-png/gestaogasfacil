
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentSummaryProps } from "../types/cashierTypes";
import { formatCurrency, formatQuantities } from "@/lib/formatUtils";
import { useState } from "react";

export const PaymentSummary = ({ 
  data, 
  formatCurrency: customFormatCurrency = formatCurrency, 
  formatQuantities: customFormatQuantities = formatQuantities 
}: PaymentSummaryProps) => {
  const [countedTotal, setCountedTotal] = useState(data.totalSales.toString());
  const difference = data.totalSales - Number(countedTotal);
  const formattedDifference = Math.abs(difference);

  const getDifferenceMessage = () => {
    if (difference === 0) return "";
    if (difference > 0) return "Faltando";
    return "Sobra";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Valores Recebidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4 space-y-2">
          <Label htmlFor="cashAmount">Dinheiro</Label>
          <div className="text-xl font-semibold text-primary">
            R$ {customFormatCurrency(data.cash)}
          </div>
          <div className="text-sm text-muted-foreground">
            {customFormatQuantities(data.quantities.cash)}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-2">
          <Label htmlFor="creditAmount">Cartão de Crédito</Label>
          <div className="text-xl font-semibold text-primary">
            R$ {customFormatCurrency(data.credit)}
          </div>
          <div className="text-sm text-muted-foreground">
            {customFormatQuantities(data.quantities.credit)}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-2">
          <Label htmlFor="debitAmount">Cartão de Débito</Label>
          <div className="text-xl font-semibold text-primary">
            R$ {customFormatCurrency(data.debit)}
          </div>
          <div className="text-sm text-muted-foreground">
            {customFormatQuantities(data.quantities.debit)}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-2">
          <Label htmlFor="pixAmount">PIX</Label>
          <div className="text-xl font-semibold text-primary">
            R$ {customFormatCurrency(data.pix)}
          </div>
          <div className="text-sm text-muted-foreground">
            {customFormatQuantities(data.quantities.pix)}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-2">
          <Label htmlFor="promissoryAmount">Promissórias</Label>
          <div className="text-xl font-semibold text-primary">
            R$ {customFormatCurrency(data.promissory)}
          </div>
          <div className="text-sm text-muted-foreground">
            {customFormatQuantities(data.quantities.promissory)}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 space-y-2">
          <Label htmlFor="gasVoucherAmount">Vale Gás</Label>
          <div className="text-xl font-semibold text-primary">
            R$ {customFormatCurrency(data.gasVoucher)}
          </div>
          <div className="text-sm text-muted-foreground">
            {customFormatQuantities(data.quantities.gasVoucher)}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="bg-secondary rounded-md p-3 w-full sm:w-64">
          <div className="flex justify-between font-medium">
            <span>Total em Sistema:</span>
            <span>R$ {customFormatCurrency(data.totalSales)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total Conferido:</span>
            <Input
              type="number"
              value={countedTotal}
              onChange={(e) => setCountedTotal(e.target.value)}
              className="w-28 text-right bg-background"
              step="0.01"
            />
          </div>
          {difference !== 0 && (
            <div className={`flex justify-between mt-2 pt-2 border-t ${difference > 0 ? 'text-red-600' : 'text-green-600'} font-medium`}>
              <span>{getDifferenceMessage()}:</span>
              <span>R$ {customFormatCurrency(formattedDifference)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
