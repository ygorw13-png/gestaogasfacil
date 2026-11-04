
import { FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDialog } from "../reports/ReportDialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { generateExcelReport } from "../reports/reportUtils";
import { toast } from "@/hooks/use-toast";

export function QuickActions() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleGenerateMonthlyReport = (dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) return;
    
    setIsGeneratingReport(true);
    setReportDialogOpen(false);

    // Gerar o arquivo Excel com dados reais do período
    generateExcelReport(dateRange)
        .then(blob => {
          // Criar link para download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          
          // Formatação de data para o nome do arquivo
          const fromDate = dateRange.from?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
          const toDate = dateRange.to?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
          
          // Configuração correta para download do arquivo Excel
          link.href = url;
          link.download = `RelatorioGásFácilAqua_${fromDate}_a_${toDate}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Relatório gerado com sucesso",
            description: "O relatório foi gerado e o download iniciado automaticamente.",
          });
          
          setIsGeneratingReport(false);
        })
        .catch(error => {
          console.error("Erro ao gerar relatório:", error);
          toast({
            title: "Erro ao gerar relatório",
            description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
            variant: "destructive",
          });
          setIsGeneratingReport(false);
        });
    }, 1000);
  };

  const handleOpenSettings = () => {
    navigate("/settings");
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setReportDialogOpen(true)}
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Gerando...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Relatório Mensal
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleOpenSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </CardContent>

      <ReportDialog 
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onGenerateReport={handleGenerateMonthlyReport}
        isGeneratingReport={isGeneratingReport}
      />
    </Card>
  );
}
