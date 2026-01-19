/**
 * Escapes a string for CSV format.
 * Wraps in quotes if it contains commas, quotes, or newlines.
 * Escapes internal quotes by doubling them.
 */
export const escapeCSV = (str: string | number | null | undefined): string => {
  if (str === null || str === undefined) return '';
  const stringValue = String(str);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Generates CSV content string from headers and rows.
 */
export const generateCSVContent = (
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
};

/**
 * Triggers a download of the given content as a CSV file.
 */
export const downloadCSV = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
