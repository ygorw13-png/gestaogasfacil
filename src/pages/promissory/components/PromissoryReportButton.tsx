
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { PromissoryNote } from "../types";
import { generatePromissoryReport } from "../utils/promissoryReportUtils";
import { toast } from "@/hooks/use-toast";

interface PromissoryReportButtonProps {
  promissories: PromissoryNote[];
  statusFilter?: string;
  className?: string;
}

export function PromissoryReportButton({ 
  promissories, 
  statusFilter,
  className = "" 
}: PromissoryReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (promissories.length === 0) {
      toast({
        title: "Sem dados para gerar relatório",
        description: "Não há notas promissórias disponíveis para incluir no relatório.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const blob = await generatePromissoryReport(promissories, statusFilter);
      
      // Criar link para download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const statusText = statusFilter ? 
        `-${statusFilter.replace(" ", "_")}` : 
        "";
      
      const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      
      // Configuração para download do arquivo Excel
      link.href = url;
      link.download = `Promissorias_GásFácil${statusText}_${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "O download do relatório foi iniciado.",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      className={`flex items-center gap-2 ${className}`}
      onClick={handleGenerateReport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Gerando...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Exportar Relatório
        </>
      )}
    </Button>
  );
}
