
import { cylinderLoansTable } from './cylinderLoans';
import { stockConfigTable } from './stockConfig';
import { stockRequestsTable } from './stockRequests';
import { colaboradoresTable } from './colaboradores';
import { profilesTable } from './profiles';
import { organizationsTable } from './organizations';
import { sistemaConfigTable, financeiroConfigTable, entregaConfigTable, segurancaConfigTable, notificacoesConfigTable } from './configTables';
import { clearTestData } from './tableUtils';

// A more type-safe approach for custom tables
export const customTables = {
  // Cylinder loans
  cylinderLoans: cylinderLoansTable,
  
  // Stock configuration
  stockConfig: stockConfigTable,
  
  // Stock requests
  stockRequests: stockRequestsTable,
  
  // Colaboradores
  colaboradores: colaboradoresTable,
  
  // Profiles
  profiles: profilesTable,

  // Organizations
  organizations: organizationsTable,

  // Configurações do sistema
  sistemaConfig: sistemaConfigTable,
  
  // Configurações financeiras
  financeiroConfig: financeiroConfigTable,
  
  // Configurações de entrega
  entregaConfig: entregaConfigTable,
  
  // Configurações de segurança
  segurancaConfig: segurancaConfigTable,
  
  // Configurações de notificações
  notificacoesConfig: notificacoesConfigTable,

  // Utility function to clear test data
  clearTestData
};

export {
  cylinderLoansTable,
  stockConfigTable,
  stockRequestsTable,
  colaboradoresTable,
  profilesTable,
  organizationsTable,
  sistemaConfigTable,
  financeiroConfigTable,
  entregaConfigTable,
  segurancaConfigTable,
  notificacoesConfigTable,
  clearTestData
};
