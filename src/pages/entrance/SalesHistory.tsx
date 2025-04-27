import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SalesFilters } from "./components/sales/SalesFilters";
import { DateRange } from "react-day-picker";
import { isSameDay, isWithinInterval, parseISO } from "date-fns";

const allSales = [
  { id: 1, time: '16:45', client: 'Maria Silva', product: 'GLP P13', quantity: 1, payment: 'PIX', amount: 120.00 },
  { id: 2, time: '16:30', client: 'João Oliveira', product: 'Água 20L', quantity: 2, payment: 'Dinheiro', amount: 24.00 },
  { id: 3, time: '16:15', client: 'André Santos', product: 'GLP P13', quantity: 1, payment: 'Crédito', amount: 120.00 },
  { id: 4, time: '15:50', client: 'Carla Pereira', product: 'GLP P13', quantity: 1, payment: 'Vale Gás', amount: 120.00 },
  { id: 5, time: '15:30', client: 'Roberto Alves', product: 'GLP P45', quantity: 1, payment: 'Promissória', amount: 360.00 },
  { id: 6, time: '15:15', client: 'Fernanda Lima', product: 'GLP P13', quantity: 1, payment: 'Débito', amount: 120.00 },
  { id: 7, time: '14:50', client: 'Ricardo Gomes', product: 'Água 20L', quantity: 3, payment: 'Dinheiro', amount: 36.00 },
  { id: 8, time: '14:30', client: 'Juliana Martins', product: 'GLP P20', quantity: 1, payment: 'PIX', amount: 180.00 },
  { id: 9, time: '14:00', client: 'Paulo Souza', product: 'GLP P13', quantity: 1, payment: 'Crédito', amount: 120.00 },
  { id: 10, time: '13:45', client: 'Sandra Costa', product: 'Água 20L', quantity: 1, payment: 'Dinheiro', amount: 12.00 },
  { id: 11, time: '13:20', client: 'Marcos Oliveira', product: 'GLP P13', quantity: 2, payment: 'Vale Gás', amount: 240.00 },
  { id: 12, time: '13:00', client: 'Ana Silva', product: 'GLP P13', quantity: 1, payment: 'PIX', amount: 120.00 },
  { id: 13, time: '12:40', client: 'Carlos Santos', product: 'GLP P45', quantity: 1, payment: 'Promissória', amount: 360.00 },
  { id: 14, time: '12:15', client: 'Lucia Ferreira', product: 'Água 20L', quantity: 2, payment: 'Débito', amount: 24.00 },
  { id: 15, time: '11:50', client: 'Eduardo Costa', product: 'GLP P13', quantity: 1, payment: 'Dinheiro', amount: 120.00 }
];

export default function SalesHistory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [productFilter, setProductFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  
  const clearFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
    setProductFilter("");
    setPaymentFilter("");
  };
  
  const filteredSales = allSales.filter(sale => {
    const matchesSearch = !searchTerm || 
      sale.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = !productFilter || sale.product === productFilter;
    const matchesPayment = !paymentFilter || sale.payment === paymentFilter;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const saleDate = parseISO(`2025-04-27T${sale.time}:00`);
      
      if (dateRange.to) {
        matchesDate = isWithinInterval(saleDate, {
          start: dateRange.from,
          end: dateRange.to
        });
      } else {
        matchesDate = isSameDay(saleDate, dateRange.from);
      }
    }
    
    return matchesSearch && matchesProduct && matchesPayment && matchesDate;
  });
  
  return (
    <div className="space-y-6 animate-in pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/entrance")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todas as Vendas</CardTitle>
          <SalesFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            productFilter={productFilter}
            onProductFilterChange={setProductFilter}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            onClearFilters={clearFilters}
          />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.time}</TableCell>
                    <TableCell>{sale.client}</TableCell>
                    <TableCell>{sale.product}</TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell>{sale.payment}</TableCell>
                    <TableCell className="text-right">
                      R$ {sale.amount.toFixed(2).replace('.', ',')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredSales.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              Nenhuma venda encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
