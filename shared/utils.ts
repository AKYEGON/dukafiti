/**
 * Calculate percentage change between current and prior values
 * @param current - Current value
 * @param prior - Prior value for comparison
 * @returns Formatted percentage change with proper sign
 */
export function calcPctChange(current: number, prior: number): string {
  // Handle edge cases
  if (prior === 0 && current === 0) return "0.0%";
  if (prior === 0 && current > 0) return "+100.0%";
  if (prior === 0 && current < 0) return "-100.0%";
  
  // Calculate percentage change
  const change = ((current - prior) / prior) * 100;
  
  // Round to one decimal place and add proper sign
  const rounded = Math.round(change * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  
  return `${sign}${rounded.toFixed(1)}%`;
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number): string {
  return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get start and end of day for a given date
 */
export function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get date range for comparison periods
 */
export function getDateRanges() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Today bounds
  const today = getDayBounds(now);
  
  // Yesterday bounds
  const yesterdayBounds = getDayBounds(yesterday);
  
  // Week to date (Monday to today)
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
  weekStart.setDate(weekStart.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Prior week to date (same period last week)
  const priorWeekStart = new Date(weekStart);
  priorWeekStart.setDate(priorWeekStart.getDate() - 7);
  
  const priorWeekEnd = new Date(yesterday);
  priorWeekEnd.setDate(priorWeekEnd.getDate() - 7);
  priorWeekEnd.setHours(23, 59, 59, 999);
  
  return {
    today,
    yesterday: yesterdayBounds,
    weekToDate: { start: weekStart, end: today.end },
    priorWeekToDate: { start: priorWeekStart, end: priorWeekEnd }
  };
}