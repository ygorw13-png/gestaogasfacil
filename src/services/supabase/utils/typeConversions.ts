
/**
 * Utility functions for safe type conversions
 * These functions help prevent TypeScript recursive type issues
 */

/**
 * Safely converts any data to the specified type using a two-step casting process
 * This breaks the recursive type chain that causes "excessively deep" TypeScript errors
 */
export function safeTypeConversion<T>(data: any): T | null {
  if (!data) return null;
  
  // Two-step casting to break recursion
  return data as unknown as T;
}

/**
 * Safely converts an array of data to an array of the specified type
 */
export function safeArrayConversion<T>(data: any[]): T[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => item as unknown as T);
}

/**
 * Creates a copy of an array with the new item added
 * Used for immutable state updates
 */
export function addItemToArray<T>(array: T[], item: T): T[] {
  return [...array, item];
}

/**
 * Updates an item in an array identified by a field value
 * Used for immutable state updates
 */
export function updateItemInArray<T>(array: T[], item: T, idField: string = 'id'): T[] {
  return array.map(existingItem => 
    (existingItem as any)[idField] === (item as any)[idField] ? item : existingItem
  );
}

/**
 * Removes an item from an array identified by a field value
 * Used for immutable state updates
 */
export function removeItemFromArray<T>(array: T[], id: string, idField: string = 'id'): T[] {
  return array.filter(item => (item as any)[idField] !== id);
}
