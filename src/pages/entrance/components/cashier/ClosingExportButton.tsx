
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as xlsx from "xlsx";
import { ClosingExportData } from "../../types/cashierTypes";
import { formatCurrency } from "@/lib/formatUtils";
import { toast } from "@/hooks/use-toast";

interface ClosingExportButtonProps {
  data: ClosingExportData | ClosingExportData[];
  fileName?: string;
  disabled?: boolean;
}

export function ClosingExportButton({ 
  data, 
  fileName = "fechamento-caixa", 
  disabled = false 
}: ClosingExportButtonProps) {
  const handleExport = () => {
    try {
      const dataArray = Array.isArray(data) ? data : [data];
      
      // Prepare worksheet data
      const worksheetData = dataArray.map(item => ({
        "Data": item.date,
        "Tipo": item.type,
        "Total Vendas (R$)": formatCurrency(item.totalSales),
        "Quantidade P13": item.p13Quantity,
        "Quantidade P20": item.p20Quantity,
        "Quantidade P45": item.p45Quantity,
        "Quantidade Água": item.waterQuantity,
        "Dinheiro (R$)": formatCurrency(item.paymentMethods.cash),
        "Crédito (R$)": formatCurrency(item.paymentMethods.credit),
        "Débito (R$)": formatCurrency(item.paymentMethods.debit),
        "PIX (R$)": formatCurrency(item.paymentMethods.pix),
        "Promissória (R$)": formatCurrency(item.paymentMethods.promissory),
        "Vale Gás (R$)": formatCurrency(item.paymentMethods.gasVoucher),
        "Estoque Inicial P13": item.inventory.initial.p13,
        "Estoque Final P13": item.inventory.final.p13,
        "Estoque Inicial P20": item.inventory.initial.p20,
        "Estoque Final P20": item.inventory.final.p20,
        "Estoque Inicial P45": item.inventory.initial.p45,
        "Estoque Final P45": item.inventory.final.p45,
        "Estoque Inicial Água": item.inventory.initial.water,
        "Estoque Final Água": item.inventory.final.water,
        "Observações": item.observations || ""
      }));
      
      // Create workbook and worksheet
      const worksheet = xlsx.utils.json_to_sheet(worksheetData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Fechamento");
      
      // Adjust column widths
      const colWidths = [
        { wch: 18 }, // Data
        { wch: 10 }, // Tipo
        { wch: 15 }, // Total Vendas
        { wch: 12 }, // Quantidade P13
        { wch: 12 }, // Quantidade P20
        { wch: 12 }, // Quantidade P45
        { wch: 12 }, // Quantidade Água
        { wch: 13 }, // Dinheiro
        { wch: 13 }, // Crédito
        { wch: 13 }, // Débito
        { wch: 13 }, // PIX
        { wch: 13 }, // Promissória
        { wch: 13 }, // Vale Gás
        { wch: 15 }, // Estoque Inicial P13
        { wch: 15 }, // Estoque Final P13
        { wch: 15 }, // Estoque Inicial P20
        { wch: 15 }, // Estoque Final P20
        { wch: 15 }, // Estoque Inicial P45
        { wch: 15 }, // Estoque Final P45
        { wch: 15 }, // Estoque Inicial Água
        { wch: 15 }, // Estoque Final Água
        { wch: 40 }, // Observações
      ];
      
      worksheet["!cols"] = colWidths;
      
      // Save the file
      xlsx.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Relatório exportado com sucesso",
        description: "O arquivo Excel foi gerado e baixado.",
      });
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      toast({
        title: "Erro ao exportar relatório",
        description: "Não foi possível gerar o arquivo Excel. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2" 
      onClick={handleExport}
      disabled={disabled}
    >
      <Download size={16} />
      <span>Exportar Excel</span>
    </Button>
  );
}
