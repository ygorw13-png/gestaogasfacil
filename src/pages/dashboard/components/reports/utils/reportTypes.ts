
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
    pedidos: number;
  };
  produtosMaisVendidos: Array<{
    produto: string;
    quantidade: number;
    percentual: string;
  }>;
  metricasFinanceiras: {
    receitaBruta: number;
    // Sem custo de mercadoria registrado: não calculáveis
    custoOperacional: number | null;
    margemLucro: number | null;
    taxaCrescimento: number | null;
  };
  sugestoes: string[];
}
