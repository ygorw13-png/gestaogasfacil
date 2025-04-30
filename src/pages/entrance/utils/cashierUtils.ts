
import { PartialClosing } from "../types/cashierTypes";

/**
 * Calculate total sales from partial closings
 */
export const getTotalSalesFromPartials = (partialClosings: PartialClosing[]): number => {
  return partialClosings.reduce((total, closing) => total + closing.totalSales, 0);
};

/**
 * Get total quantity of a specific product type from all partial closings
 */
export const getTotalQuantityFromPartials = (
  partialClosings: PartialClosing[], 
  productType: 'p13' | 'p20' | 'p45' | 'water'
): number => {
  return partialClosings.reduce((total, closing) => total + closing.quantities[productType], 0);
};

/**
 * Get total quantity of a specific product type for a specific payment method from all partial closings
 */
export const getTotalQuantityTypeFromPartials = (
  partialClosings: PartialClosing[],
  productType: 'p13' | 'p20' | 'p45' | 'water',
  paymentType: string
): number => {
  // In a real implementation, this would calculate based on payment type,
  // but our mock data doesn't have payment types per product
  // For now, we'll just return a portion of the total
  const total = getTotalQuantityFromPartials(partialClosings, productType);
  return Math.floor(total / 6);  // Divide evenly among 6 payment types
};
