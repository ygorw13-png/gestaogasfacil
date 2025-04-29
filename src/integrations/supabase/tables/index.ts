
import { cylinderLoansTable } from './cylinderLoans';
import { stockConfigTable } from './stockConfig';
import { stockRequestsTable } from './stockRequests';
import { colaboradoresTable } from './colaboradores';
import { profilesTable } from './profiles';
import { organizationsTable } from './organizations';
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
  clearTestData
};
