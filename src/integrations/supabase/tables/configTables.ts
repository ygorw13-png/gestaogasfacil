
import { createTableOperations } from './tableUtils';

// Configurações do sistema
export const sistemaConfigTable = createTableOperations('configuracoes_sistema');

// Configurações financeiras
export const financeiroConfigTable = createTableOperations('configuracoes_financeiras');

// Configurações de entrega
export const entregaConfigTable = createTableOperations('configuracoes_entrega');

// Configurações de segurança
export const segurancaConfigTable = createTableOperations('configuracoes_seguranca');

// Configurações de notificações
export const notificacoesConfigTable = createTableOperations('configuracoes_notificacoes');
