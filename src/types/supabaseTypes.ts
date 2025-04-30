
import { Json } from "@/integrations/supabase/types";

export interface StockConfig {
  id: string;
  produto: string;
  estoque_minimo: number;
  alerta_ativo: boolean;
  destinatarios_alerta?: Json;
  atualizado_por: string;
  atualizado_em: string;
}

export type RequestStatus = 'pendente' | 'aprovada' | 'recusada' | 'cancelada' | 'entregue';
export type OriginDestination = 'portaria' | 'rota' | 'estoque';
export type ClientType = 'cliente' | 'agregado';
export type CylinderType = 'P13' | 'P20' | 'P45' | 'agua';
export type LoanStatus = 'emprestado' | 'devolvido' | 'parcial';
export type PaymentMethod = 'dinheiro' | 'credito' | 'debito' | 'pix' | 'promissoria' | 'vale_gas';
export type CommissionStatus = 'pendente' | 'paga' | 'cancelada';
export type ReportFormat = 'csv' | 'pdf' | 'excel' | 'json';
export type ReportStatus = 'sucesso' | 'falha' | 'pendente';
export type SendMethod = 'email' | 'whatsapp' | 'nenhum';
export type EmployeeStatus = 'ativo' | 'inativo';

export interface StockRequest {
  id: string;
  solicitante_id: string;
  status: RequestStatus;
  data_solicitacao: string;
  data_processamento?: string;
  processado_por?: string;
  itens: Json;
  observacoes?: string;
  origem: OriginDestination;
  destino: OriginDestination;
  solicitante?: { name: string };
  processador?: { name: string };
}

export interface CylinderLoan {
  id: string;
  cliente_id: string;
  tipo_cliente: ClientType;
  tipo_vasilhame: CylinderType;
  quantidade: number;
  data_emprestimo: string;
  data_devolucao?: string;
  status: LoanStatus;
  registrado_por: string;
  observacoes?: string;
}

export interface ClientHistory {
  id: string;
  cliente_id: string;
  tipo_cliente: ClientType;
  data_compra: string;
  valor: number;
  produtos: Json[];
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
  status: CommissionStatus;
  data_pagamento?: string;
  ordem_id?: string;
  observacoes?: string;
}

export interface Report {
  id: string;
  tipo_relatorio: string;
  data_geracao: string;
  formato: ReportFormat;
  url_arquivo?: string;
  gerado_por: string;
  enviado_por?: SendMethod;
  destinatarios?: Json[];
  status: ReportStatus;
  detalhes_erro?: string;
}

export interface DbProfile {
  id: string;
  name: string;
  role: string;
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  telefone?: string;
  cpf?: string;
  data_admissao: string;
  situacao: EmployeeStatus;
  observacoes?: string;
  organization_id: string;
  criado_em: string;
  atualizado_em: string;
}
