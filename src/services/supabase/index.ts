
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
