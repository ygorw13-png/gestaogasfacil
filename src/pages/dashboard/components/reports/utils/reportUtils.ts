
import { DateRange } from "react-day-picker";
import { generateReportData } from './reportDataGenerator';
import { generateResumoSheet, generateProdutosSheet, generateVendasSheet } from './sheetGenerator';
import * as xlsx from 'xlsx';

export const generateExcelReport = async (dateRange: DateRange): Promise<Blob> => {
  const reportData = await generateReportData(dateRange);
  const workbook = xlsx.utils.book_new();

  // Generate individual sheets
  generateResumoSheet(workbook, reportData);
  generateProdutosSheet(workbook, reportData);
  generateVendasSheet(workbook, reportData);

  // Generate the Excel file
  const excelBuffer = xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};

