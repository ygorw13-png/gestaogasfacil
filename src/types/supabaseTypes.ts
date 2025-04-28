
export interface StockConfig {
  id: string;
  produto: string;
  estoque_minimo: number;
  alerta_ativo: boolean;
  destinatarios_alerta?: any[];
  atualizado_por: string;
  atualizado_em: string;
}

export interface StockRequest {
  id: string;
  solicitante_id: string;
  status: 'pendente' | 'aprovada' | 'recusada' | 'cancelada' | 'entregue';
  data_solicitacao: string;
  data_processamento?: string;
  processado_por?: string;
  itens: Array<{
    produto: string;
    quantidade: number;
  }>;
  observacoes?: string;
  origem: 'portaria' | 'rota' | 'estoque';
  destino: 'portaria' | 'rota' | 'estoque';
  solicitante?: { name: string };
  processador?: { name: string };
}

export interface CylinderLoan {
  id: string;
  cliente_id: string;
  tipo_cliente: 'cliente' | 'agregado';
  tipo_vasilhame: 'P13' | 'P20' | 'P45' | 'agua';
  quantidade: number;
  data_emprestimo: string;
  data_devolucao?: string;
  status: 'emprestado' | 'devolvido' | 'parcial';
  registrado_por: string;
  observacoes?: string;
}

export interface ClientHistory {
  id: string;
  cliente_id: string;
  tipo_cliente: 'cliente' | 'agregado';
  data_compra: string;
  valor: number;
  produtos: any[];
  metodo_pagamento: string;
  ordem_id?: string;
  observacoes?: string;
  registrado_por: string;
}

export interface SalesCommission {
  id: string;
  vendedor_id: string;
  data_venda: string;
  valor_venda: number;
  valor_comissao: number;
  percentual_comissao: number;
  status: 'pendente' | 'paga' | 'cancelada';
  data_pagamento?: string;
  ordem_id?: string;
  observacoes?: string;
}

export interface Report {
  id: string;
  tipo_relatorio: string;
  data_geracao: string;
  formato: 'csv' | 'pdf' | 'excel' | 'json';
  url_arquivo?: string;
  gerado_por: string;
  enviado_por?: 'email' | 'whatsapp' | 'nenhum';
  destinatarios?: any[];
  status: 'sucesso' | 'falha' | 'pendente';
  detalhes_erro?: string;
}
