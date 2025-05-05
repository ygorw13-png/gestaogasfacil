
// This file is now an index file that re-exports everything from our new modular structure
// It's maintained for backward compatibility

// Export types
export { 
  ApiResponse,
  ValidTableName,
  QueryOptions
} from './supabase/types';

// Export utility functions
export {
  createErrorResponse,
  createSuccessResponse,
  applyFilters,
  applySorting,
  applyPagination
} from './supabase/utils';

// Export CRUD operations
export {
  fetchData,
  insertData,
  updateData,
  deleteData
} from './supabase/crud';

// Export hooks
export {
  useSupabaseTable
} from './supabase/hooks';
