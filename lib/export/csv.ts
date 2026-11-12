/**
 * CSV Export Utility
 * 
 * Generates CSV files from tabular data with:
 * - UTF-8 with BOM (for Excel compatibility with special characters)
 * - Proper escaping of quotes and commas
 * - CSV injection protection (prefixes cells starting with =, +, -, @ with single quote)
 * - Null handling (renders as empty string)
 */

export interface CsvColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

export interface CsvOptions {
  filename: string;
  columns: CsvColumn[];
  data: Record<string, unknown>[];
}

/**
 * Escape a CSV cell value
 * - Wraps in quotes if contains comma, quote, or newline
 * - Escapes internal quotes by doubling them
 * - Prefixes potential formula injection characters with single quote
 */
export function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  
  let str = String(value);
  
  // CSV injection protection: prefix dangerous characters
  if (str.length > 0 && /^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  
  // If contains special characters, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

/**
 * Generate CSV string from data
 */
export function generateCsv(options: CsvOptions): string {
  const { columns, data } = options;
  
  // Header row
  const headerRow = columns.map((col) => escapeCsvCell(col.label)).join(",");
  
  // Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.format ? col.format(value) : value;
        return escapeCsvCell(formatted);
      })
      .join(",");
  });
  
  return [headerRow, ...dataRows].join("\r\n");
}

/**
 * Trigger browser download of CSV file
 * Includes UTF-8 BOM for Excel compatibility
 */
export function downloadCsv(options: CsvOptions): void {
  const csvContent = generateCsv(options);
  
  // Add UTF-8 BOM for Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = options.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
