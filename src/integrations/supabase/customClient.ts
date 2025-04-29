
// This file is kept for backward compatibility
// It re-exports all tables from the new modular structure
import { customTables } from './tables';

export { customTables };

// Export individual table interfaces for direct imports
export * from './tables';
