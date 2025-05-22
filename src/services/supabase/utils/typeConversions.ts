
/**
 * Safely converts an array of unknown data to the specified type
 * Uses explicit type assertion to avoid recursive type instantiation
 */
export function safeArrayConversion<T>(data: unknown[]): T[] {
  return data as T[];
}

/**
 * Safely converts a single object to the specified type
 * Uses explicit type assertion to avoid recursive type instantiation
 */
export function safeTypeConversion<T>(data: unknown): T {
  return data as T;
}

/**
 * Updates an item in an array by id or custom key
 */
export function updateItemInArray<T extends Record<string, unknown>>(
  array: T[],
  item: T,
  idField: string = 'id'
): T[] {
  return array.map(existingItem => 
    existingItem[idField] === item[idField] ? item : existingItem
  );
}

/**
 * Adds an item to an array
 */
export function addItemToArray<T>(array: T[], item: T): T[] {
  return [...array, item];
}

/**
 * Removes an item from array by id or custom key
 */
export function removeItemFromArray<T extends Record<string, unknown>>(
  array: T[],
  id: string | number,
  idField: string = 'id'
): T[] {
  return array.filter(item => String(item[idField]) !== String(id));
}
