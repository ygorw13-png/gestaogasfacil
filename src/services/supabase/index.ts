
// Export types
export type * from './types';

// Export utility functions
export * from './utils';

// Export CRUD operations
export {
  fetchData,
  insertData,
  updateData,
  deleteData
} from './crud';

// Export hooks
export {
  useSupabaseTable
} from './hooks';

// Re-export hooks from their specific files to maintain backward compatibility
export { useTableData } from './hooks/useTableData';
export { useTableCRUD } from './hooks/useTableCRUD';
