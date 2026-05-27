/**
 * Generic CSV export utility.
 * Builds a CSV from rows and triggers a browser download.
 */

type CsvValue = string | number | boolean | null | undefined | Date;

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => CsvValue;
}

export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[]
): void {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(",");
  const bodyLines = rows.map((row) =>
    columns.map((c) => escapeCell(c.accessor(row))).join(",")
  );
  const csv = "\uFEFF" + [headerLine, ...bodyLines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
