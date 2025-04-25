
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";

interface CashierData {
  cash: number;
  credit: number;
  debit: number;
  pix: number;
  promissory: number;
  gasVoucher: number;
  totalSales: number;
  // Add quantities for each payment type
  quantities: {
    cash: { p13: number; p20: number; p45: number; water: number; };
    credit: { p13: number; p20: number; p45: number; water: number; };
    debit: { p13: number; p20: number; p45: number; water: number; };
    pix: { p13: number; p20: number; p45: number; water: number; };
    promissory: { p13: number; p20: number; p45: number; water: number; };
    gasVoucher: { p13: number; p20: number; p45: number; water: number; };
  };
}

interface CashierClosingProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  cashierData: CashierData;
}

export default function CashierClosing({ isOpen, onOpenChange, onSubmit, cashierData }: CashierClosingProps) {
  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  const formatQuantities = (quantities: { p13: number; p20: number; p45: number; water: number; }) => {
    const parts = [];
    if (quantities.p13) parts.push(`${quantities.p13} P13`);
    if (quantities.p20) parts.push(`${quantities.p20} P20`);
    if (quantities.p45) parts.push(`${quantities.p45} P45`);
    if (quantities.water) parts.push(`${quantities.water} Água`);
    return parts.join(', ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Mock inventory data for closing
  const inventoryClosing = [
    { product: 'GLP P13', initial: 15, additions: 5, sales: 8, final: 12 },
    { product: 'GLP P20', initial: 3, additions: 1, sales: 2, final: 2 },
    { product: 'GLP P45', initial: 1, additions: 1, sales: 0, final: 2 },
    { product: 'Água 20L', initial: 20, additions: 10, sales: 15, final: 15 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Fechar Caixa</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento de Caixa da Portaria</DialogTitle>
          <DialogDescription>
            Confira os valores recebidos e o estoque final antes de fechar o caixa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Valores Recebidos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cashAmount">Dinheiro</Label>
                <Input 
                  id="cashAmount" 
                  value={`R$ ${formatCurrency(cashierData.cash)} (${formatQuantities(cashierData.quantities.cash)})`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditAmount">Cartão de Crédito</Label>
                <Input 
                  id="creditAmount" 
                  value={`R$ ${formatCurrency(cashierData.credit)} (${formatQuantities(cashierData.quantities.credit)})`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debitAmount">Cartão de Débito</Label>
                <Input 
                  id="debitAmount" 
                  value={`R$ ${formatCurrency(cashierData.debit)} (${formatQuantities(cashierData.quantities.debit)})`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pixAmount">PIX</Label>
                <Input 
                  id="pixAmount" 
                  value={`R$ ${formatCurrency(cashierData.pix)} (${formatQuantities(cashierData.quantities.pix)})`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promissoryAmount">Promissórias</Label>
                <Input 
                  id="promissoryAmount" 
                  value={`R$ ${formatCurrency(cashierData.promissory)} (${formatQuantities(cashierData.quantities.promissory)})`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gasVoucherAmount">Vale Gás</Label>
                <Input 
                  id="gasVoucherAmount" 
                  value={`R$ ${formatCurrency(cashierData.gasVoucher)} (${formatQuantities(cashierData.quantities.gasVoucher)})`}
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-secondary rounded-md p-3 w-full sm:w-64">
                <div className="flex justify-between font-medium">
                  <span>Total em Sistema:</span>
                  <span>R$ {formatCurrency(cashierData.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Conferido:</span>
                  <span>R$ {formatCurrency(cashierData.totalSales)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span>Diferença:</span>
                  <span className="text-green-600 font-medium">R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fechamento de Estoque</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Inicial</TableHead>
                    <TableHead className="text-right">Adições</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Final</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryClosing.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product}</TableCell>
                      <TableCell className="text-right">{item.initial}</TableCell>
                      <TableCell className="text-right">{item.additions}</TableCell>
                      <TableCell className="text-right">{item.sales}</TableCell>
                      <TableCell className="text-right">{item.final}</TableCell>
                      <TableCell className="text-right">
                        {item.initial + item.additions - item.sales === item.final ? (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" /> Ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" /> Verificar
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Observações</h3>
            <textarea 
              className="w-full min-h-[100px] p-3 border rounded-md resize-y"
              placeholder="Digite observações sobre o fechamento de caixa..."
            ></textarea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar Fechamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
