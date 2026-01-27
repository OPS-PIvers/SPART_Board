/**
 * Downloads a CSV file with the given filename, headers, and rows.
 * Handles escaping of quotes and commas in cell values.
 *
 * @param filename - The name of the file to download (e.g., 'data.csv')
 * @param headers - Array of column headers
 * @param rows - Array of rows, where each row is an array of cell values
 */
export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean)[][]
): void => {
  const processCell = (cell: string | number | boolean): string => {
    const stringValue = String(cell);
    // Escape quotes by doubling them, and wrap in quotes if it contains comma, quote, or newline
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvContent = [
    headers.map(processCell).join(','),
    ...rows.map((row) => row.map(processCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
