/**
 * Utility to format dates into Indonesian format (DD/MM/YYYY)
 * Example: '2026-07-11' -> '11/07/2026'
 */
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in DD/MM/YYYY format, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try parsing YYYY-MM-DD format (very fast & robust)
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return `${day}/${month}/${year}`;
    }
  }

  // Fallback to JS Date parsing
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Ignore and return original
  }

  return dateStr;
}
