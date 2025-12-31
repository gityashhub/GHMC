/**
 * Export utilities for CSV/Excel export
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T | string; header: string }>,
  formatters?: Record<string, (value: any) => string>
): string {
  if (data.length === 0) return '';

  // Create header row
  const headers = columns.map(col => col.header);
  const csvRows = [headers.join(',')];

  // Create data rows
  data.forEach(item => {
    const row = columns.map(col => {
      const key = col.key as string;
      let value = item[key];
      
      // Apply formatter if provided
      if (formatters && formatters[key]) {
        value = formatters[key](value);
      } else if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        // Handle nested objects (e.g., company.name)
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      
      // Escape commas and quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T | string; header: string }>,
  filename: string,
  formatters?: Record<string, (value: any) => string>
): void {
  const csv = arrayToCSV(data, columns, formatters);
  downloadCSV(csv, filename);
}

/**
 * Format date for CSV export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForExport(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return num.toFixed(2);
}

