
/**
 * Formats a numeric value to Brazilian currency format
 * @param value - The numeric value to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

/**
 * Formats quantities of gas and water products
 * @param quantities - Object containing quantities of different products
 * @returns Formatted string of quantities
 */
export const formatQuantities = (quantities: { p13?: number; p20?: number; p45?: number; water?: number; }): string => {
  const parts = [];
  if (quantities.p13) parts.push(`${quantities.p13} P13`);
  if (quantities.p20) parts.push(`${quantities.p20} P20`);
  if (quantities.p45) parts.push(`${quantities.p45} P45`);
  if (quantities.water) parts.push(`${quantities.water} Água`);
  return parts.join(', ');
};
