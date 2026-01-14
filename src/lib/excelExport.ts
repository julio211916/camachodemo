import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columnWidths?: number[];
}

/**
 * Export data to Excel using exceljs
 */
export const exportToExcel = async (
  data: Record<string, any>[],
  options: ExportOptions
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName || 'Datos');

  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Add headers
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Style headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  data.forEach(item => {
    worksheet.addRow(Object.values(item));
  });

  // Set column widths
  if (options.columnWidths) {
    options.columnWidths.forEach((width, idx) => {
      worksheet.getColumn(idx + 1).width = width;
    });
  } else {
    // Auto-fit columns based on content
    worksheet.columns.forEach((column, idx) => {
      let maxLength = headers[idx]?.length || 10;
      data.forEach(item => {
        const value = String(Object.values(item)[idx] || '');
        if (value.length > maxLength) {
          maxLength = value.length;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV
 */
export const exportToCSV = (
  data: Record<string, any>[],
  filename: string
): void => {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export multiple sheets to Excel workbook
 */
export const exportMultiSheetExcel = async (
  sheets: { name: string; data: Record<string, any>[] }[],
  filename: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;
    
    const worksheet = workbook.addWorksheet(sheet.name);
    const headers = Object.keys(sheet.data[0]);
    
    // Add headers
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    sheet.data.forEach(item => {
      worksheet.addRow(Object.values(item));
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, idx) => {
      let maxLength = headers[idx]?.length || 10;
      sheet.data.forEach(item => {
        const value = String(Object.values(item)[idx] || '');
        if (value.length > maxLength) {
          maxLength = value.length;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse Excel file and return data
 */
export const parseExcelFile = async (file: File): Promise<{ sheetNames: string[]; data: Record<string, any>[] }> => {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  
  const sheetNames = workbook.worksheets.map(ws => ws.name);
  const firstSheet = workbook.worksheets[0];
  
  if (!firstSheet) {
    return { sheetNames: [], data: [] };
  }

  const headers: string[] = [];
  const data: Record<string, any>[] = [];

  firstSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(String(cell.value || ''));
      });
    } else {
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1] || `col${colNumber}`] = cell.value;
      });
      data.push(rowData);
    }
  });

  return { sheetNames, data };
};
