import { Lock, TrendingUp, Users, DollarSign, ChartPie, Settings, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { ReportDialog } from "./reports/ReportDialog";
import { generateExcelReport } from "./reports/reportUtils";

export function AdminSection() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleGenerateMonthlyReport = (dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) return;
    
    setIsGeneratingReport(true);
    setReportDialogOpen(false);
    
    // Simula o tempo necessário para gerar o relatório
    setTimeout(() => {
      setIsGeneratingReport(false);
      
      // Gerar o arquivo Excel
      generateExcelReport(dateRange)
        .then(blob => {
          // Criar link para download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          
          // Formatação de data para o nome do arquivo
          const fromDate = dateRange.from?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
          const toDate = dateRange.to?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
          
          link.href = url;
          link.download = `RelatorioGasFlowAqua_${fromDate}_a_${toDate}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Relatório gerado com sucesso",
            description: "O relatório foi gerado e o download iniciado automaticamente.",
          });
        })
        .catch(error => {
          console.error("Erro ao gerar relatório:", error);
          toast({
            title: "Erro ao gerar relatório",
            description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
            variant: "destructive",
          });
        });
    }, 1500);
  };

  const handleOpenSettings = () => {
    // Utilizando o React Router para navegação em vez de window.location
    navigate("/settings");
  };

  return (
    <Card className="border-gasflow-200 bg-gasflow-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-gasflow-700" />
          <CardTitle className="text-gasflow-700">Área de Administração</CardTitle>
        </div>
        <CardDescription>
          Esta seção só é visível para usuários com permissão de Administrador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 gap-4 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="finance" className="data-[state=active]:bg-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Faturamento Total</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">R$ 42.580,00</div>
                  <p className="text-xs text-muted-foreground">Último mês</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Média de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">R$ 1.580,00</div>
                  <p className="text-xs text-muted-foreground">Por dia</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">+2% desde semana passada</p>
                </CardContent>
              </Card>
            </div>

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
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Usuários Ativos</CardTitle>
                <CardDescription>Total de 24 usuários registrados no sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Administradores</span>
                    </div>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Gerentes</span>
                    </div>
                    <span className="text-sm font-medium">8</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Operadores</span>
                    </div>
                    <span className="text-sm font-medium">13</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Métricas Financeiras</CardTitle>
                <CardDescription>Resumo do desempenho financeiro</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Receita Bruta</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">R$ 158.450,00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      <span>Lucro Líquido</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">R$ 42.580,00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
