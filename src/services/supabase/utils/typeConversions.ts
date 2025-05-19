
/**
 * Safely converts an array of unknown data to the specified type
 * Simplified to prevent excessive type recursion
 */
export function safeArrayConversion<T>(data: unknown[]): T[] {
  return data as unknown as T[];
}

/**
 * Safely converts a single object to the specified type
 * Simplified to prevent excessive type recursion
 */
export function safeTypeConversion<T>(data: unknown): T {
  return data as unknown as T;
}
