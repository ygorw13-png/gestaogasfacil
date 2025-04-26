
export interface ReportData {
  periodo: {
    inicio: string;
    fim: string;
  };
  vendasDiarias: Array<{
    data: string;
    valor: number;
  }>;
  totais: {
    vendasTotais: number;
    mediaDiaria: number;
    diasAnalisados: number;
  };
  produtosMaisVendidos: Array<{
    produto: string;
    quantidade: number;
    percentual: string;
  }>;
  metricasFinanceiras: {
    receitaBruta: number;
    custoOperacional: number;
    margemLucro: number;
    taxaCrescimento: number;
  };
  sugestoes: string[];
}
