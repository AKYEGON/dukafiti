/**
 * Currency formatting utilities for DukaFiti
 */

/**
 * Format currency value for display (KES)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'KES 0.00';
  
  return `KES ${numValue.toLocaleString('en-KE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Calculate percentage change between current and prior values
 */
export function calcPctChange(current: number, prior: number): string {
  if (prior === 0 && current === 0) return "0.0%";
  if (prior === 0 && current > 0) return "New";
  if (prior === 0 && current < 0) return "New";
  
  const change = ((current - prior) / prior) * 100;
  const rounded = Math.round(change * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  
  return `${sign}${rounded.toFixed(1)}%`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

/**
 * Format number as currency input (without KES prefix)
 */
export function formatCurrencyInput(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00';
  
  return numValue.toFixed(2);
}