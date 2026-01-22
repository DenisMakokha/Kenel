/**
 * Export Utilities for Kenels LMS
 * Provides functions for exporting data to various formats (CSV, Excel, PDF, JSON)
 * and integration with accounting systems
 */

import { formatDate } from './utils';

// Types
export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any, row: any) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
  includeTimestamp?: boolean;
}

export interface AccountingExportConfig {
  system: 'quickbooks' | 'sage' | 'xero' | 'generic';
  dateFormat: string;
  accountMappings: Record<string, string>;
}

// CSV Export
export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data, includeTimestamp = true } = options;

  // Build header row
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Build data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      if (col.formatter) {
        value = col.formatter(value, row);
      }
      // Escape quotes and wrap in quotes
      if (value === null || value === undefined) {
        return '""';
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n');

  // Create and download file
  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  downloadFile(csvContent, `${filename}${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

// Excel Export (CSV with BOM for Excel compatibility)
export function exportToExcel(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle, includeTimestamp = true } = options;

  let content = '';

  // Add title and subtitle if provided
  if (title) {
    content += `"${title}"\n`;
  }
  if (subtitle) {
    content += `"${subtitle}"\n`;
  }
  if (title || subtitle) {
    content += '\n';
  }

  // Build header row
  const headers = columns.map(col => `"${col.header}"`).join(',');
  content += headers + '\n';

  // Build data rows
  data.forEach(row => {
    const rowData = columns.map(col => {
      let value = row[col.key];
      if (col.formatter) {
        value = col.formatter(value, row);
      }
      if (value === null || value === undefined) {
        return '""';
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
    content += rowData + '\n';
  });

  // Add BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  // Use .csv extension - Excel opens CSV files correctly
  downloadFile(BOM + content, `${filename}${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

// PDF Export (generates a printable HTML that opens in new window for printing/saving as PDF)
export function exportToPdf(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle, includeTimestamp = true } = options;

  const timestamp = includeTimestamp ? new Date().toLocaleDateString() : '';

  // Build HTML table
  const headerCells = columns.map(col => `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; text-align: left;">${col.header}</th>`).join('');

  const rows = data.map(row => {
    const cells = columns.map(col => {
      let value = row[col.key];
      if (col.formatter) {
        value = col.formatter(value, row);
      }
      if (value === null || value === undefined) {
        value = '';
      }
      return `<td style="border: 1px solid #ddd; padding: 8px;">${String(value)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title || filename}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 5px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 20px;
    }
    .meta {
      color: #888;
      font-size: 12px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #059669 !important;
      color: white !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #888;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${title ? `<h1>${title}</h1>` : ''}
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  <p class="meta">Generated: ${timestamp} | Total Records: ${data.length}</p>
  
  <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
    Print / Save as PDF
  </button>
  
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  
  <div class="footer">
    Kenels LMS - ${title || filename} | Page 1
  </div>
  
  <script>
    // Auto-trigger print dialog
    // window.print();
  </script>
</body>
</html>
  `;

  // Open in new window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// JSON Export
export function exportToJSON(options: ExportOptions): void {
  const { filename, columns, data, includeTimestamp = true } = options;

  // Transform data using column formatters if provided
  const transformedData = data.map(row => {
    const transformed: Record<string, any> = {};
    columns.forEach(col => {
      let value = row[col.key];
      if (col.formatter) {
        value = col.formatter(value, row);
      }
      transformed[col.key] = value;
    });
    return transformed;
  });

  const jsonContent = JSON.stringify({
    exportDate: new Date().toISOString(),
    recordCount: transformedData.length,
    data: transformedData
  }, null, 2);

  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  downloadFile(jsonContent, `${filename}${timestamp}.json`, 'application/json;charset=utf-8;');
}

// Accounting System Export - QuickBooks IIF Format
export function exportToQuickBooks(
  transactions: any[],
  filename: string,
  accountMappings: Record<string, string>
): void {
  const lines: string[] = [];

  // IIF Header
  lines.push('!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO');
  lines.push('!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO');
  lines.push('!ENDTRNS');

  transactions.forEach(txn => {
    const date = new Date(txn.date).toLocaleDateString('en-US');
    const debitAccount = accountMappings[txn.type + '_DEBIT'] || accountMappings['DEFAULT_DEBIT'] || 'Loans Receivable';
    const creditAccount = accountMappings[txn.type + '_CREDIT'] || accountMappings['DEFAULT_CREDIT'] || 'Cash';

    // Main transaction line
    lines.push(`TRNS\tGENERAL JOURNAL\t${date}\t${debitAccount}\t${txn.clientName || ''}\t${txn.amount}\t${txn.description || ''}`);
    // Split line
    lines.push(`SPL\tGENERAL JOURNAL\t${date}\t${creditAccount}\t${txn.clientName || ''}\t${-txn.amount}\t${txn.description || ''}`);
    lines.push('ENDTRNS');
  });

  const content = lines.join('\n');
  downloadFile(content, `${filename}_${new Date().toISOString().slice(0, 10)}.iif`, 'text/plain;charset=utf-8;');
}

// Accounting System Export - Sage CSV Format
export function exportToSage(
  transactions: any[],
  filename: string,
  accountMappings: Record<string, string>
): void {
  const columns: ExportColumn[] = [
    { key: 'transactionDate', header: 'Transaction Date', formatter: (v) => new Date(v).toLocaleDateString('en-GB') },
    { key: 'reference', header: 'Reference' },
    { key: 'nominalCode', header: 'Nominal Code' },
    { key: 'department', header: 'Department' },
    { key: 'details', header: 'Details' },
    { key: 'netAmount', header: 'Net Amount' },
    { key: 'taxCode', header: 'Tax Code' },
    { key: 'taxAmount', header: 'Tax Amount' },
  ];

  const data = transactions.flatMap(txn => {
    const debitCode = accountMappings[txn.type + '_DEBIT'] || '1100';
    const creditCode = accountMappings[txn.type + '_CREDIT'] || '1200';

    return [
      {
        transactionDate: txn.date,
        reference: txn.reference || txn.id,
        nominalCode: debitCode,
        department: '',
        details: `${txn.type} - ${txn.clientName || 'Unknown'}`,
        netAmount: txn.amount,
        taxCode: 'T0',
        taxAmount: 0,
      },
      {
        transactionDate: txn.date,
        reference: txn.reference || txn.id,
        nominalCode: creditCode,
        department: '',
        details: `${txn.type} - ${txn.clientName || 'Unknown'}`,
        netAmount: -txn.amount,
        taxCode: 'T0',
        taxAmount: 0,
      }
    ];
  });

  exportToCSV({ filename: `${filename}_sage`, columns, data });
}

// Accounting System Export - Xero CSV Format
export function exportToXero(
  transactions: any[],
  filename: string,
  accountMappings: Record<string, string>
): void {
  const columns: ExportColumn[] =
    [
    { key: 'Date', header: '*Date' },
    { key: 'Amount', header: '*Amount' },
    { key: 'Payee', header: 'Payee' },
    { key: 'Description', header: 'Description' },
    { key: 'Reference', header: 'Reference' },
    { key: 'AccountCode', header: 'Account Code' },
    { key: 'TaxType', header: 'Tax Type' },
  ];

  const data = transactions.map(txn => ({
    Date: new Date(txn.date).toLocaleDateString('en-GB'),
    Amount: txn.amount,
    Payee: txn.clientName || '',
    Description: txn.description || txn.type,
    Reference: txn.reference || txn.id,
    AccountCode: accountMappings[txn.type] || accountMappings['DEFAULT'] || '200',
    TaxType: 'No VAT',
  }));

  exportToCSV({ filename: `${filename}_xero`, columns, data });
}

// Generic Journal Entry Export
export function exportJournalEntries(
  entries: any[],
  filename: string
): void {
  const columns: ExportColumn[] = [
    { key: 'date', header: 'Date', formatter: (v) => formatDate(v) },
    { key: 'journalNumber', header: 'Journal #' },
    { key: 'accountCode', header: 'Account Code' },
    { key: 'accountName', header: 'Account Name' },
    { key: 'description', header: 'Description' },
    { key: 'debit', header: 'Debit', formatter: (v) => v > 0 ? v.toFixed(2) : '' },
    { key: 'credit', header: 'Credit', formatter: (v) => v > 0 ? v.toFixed(2) : '' },
    { key: 'reference', header: 'Reference' },
  ];

  exportToExcel({ filename, columns, data: entries, title: 'Journal Entries Export' });
}

// Loan Portfolio Export
export function exportLoanPortfolio(loans: any[], filename: string): void {
  const columns: ExportColumn[] = [
    { key: 'loanNumber', header: 'Loan Number' },
    { key: 'clientName', header: 'Client Name' },
    { key: 'clientCode', header: 'Client Code' },
    { key: 'product', header: 'Product' },
    { key: 'disbursedAmount', header: 'Disbursed Amount', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'outstandingBalance', header: 'Outstanding Balance', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'interestRate', header: 'Interest Rate (%)' },
    { key: 'disbursementDate', header: 'Disbursement Date', formatter: (v) => v ? formatDate(v) : '' },
    { key: 'maturityDate', header: 'Maturity Date', formatter: (v) => v ? formatDate(v) : '' },
    { key: 'status', header: 'Status' },
    { key: 'daysInArrears', header: 'Days in Arrears' },
  ];

  exportToExcel({
    filename,
    columns,
    data: loans,
    title: 'Loan Portfolio Report',
    subtitle: `Generated on ${formatDate(new Date())}`
  });
}

// Repayment Schedule Export
export function exportRepaymentSchedule(schedules: any[], loanNumber: string): void {
  const columns: ExportColumn[] = [
    { key: 'installmentNumber', header: 'Installment #' },
    { key: 'dueDate', header: 'Due Date', formatter: (v) => formatDate(v) },
    { key: 'principal', header: 'Principal', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'interest', header: 'Interest', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'fees', header: 'Fees', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'totalDue', header: 'Total Due', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'amountPaid', header: 'Amount Paid', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'balance', header: 'Balance', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'status', header: 'Status' },
    { key: 'paidDate', header: 'Paid Date', formatter: (v) => v ? formatDate(v) : '' },
  ];

  exportToExcel({
    filename: `repayment_schedule_${loanNumber}`,
    columns,
    data: schedules,
    title: `Repayment Schedule - ${loanNumber}`,
    subtitle: `Generated on ${formatDate(new Date())}`
  });
}

// Collections Report Export
export function exportCollectionsReport(collections: any[], filename: string): void {
  const columns: ExportColumn[] = [
    { key: 'date', header: 'Date', formatter: (v) => formatDate(v) },
    { key: 'receiptNumber', header: 'Receipt #' },
    { key: 'loanNumber', header: 'Loan #' },
    { key: 'clientName', header: 'Client Name' },
    { key: 'amount', header: 'Amount', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'channel', header: 'Payment Channel' },
    { key: 'reference', header: 'Reference' },
    { key: 'postedBy', header: 'Posted By' },
  ];

  exportToExcel({
    filename,
    columns,
    data: collections,
    title: 'Collections Report',
    subtitle: `Generated on ${formatDate(new Date())}`
  });
}

// Arrears Report Export
export function exportArrearsReport(arrears: any[], filename: string): void {
  const columns: ExportColumn[] = [
    { key: 'loanNumber', header: 'Loan Number' },
    { key: 'clientName', header: 'Client Name' },
    { key: 'clientPhone', header: 'Phone' },
    { key: 'product', header: 'Product' },
    { key: 'outstandingBalance', header: 'Outstanding Balance', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'arrearsAmount', header: 'Arrears Amount', formatter: (v) => v?.toFixed(2) || '0.00' },
    { key: 'daysInArrears', header: 'Days in Arrears' },
    { key: 'lastPaymentDate', header: 'Last Payment Date', formatter: (v) => v ? formatDate(v) : 'Never' },
    { key: 'nextDueDate', header: 'Next Due Date', formatter: (v) => v ? formatDate(v) : '' },
    { key: 'assignedOfficer', header: 'Assigned Officer' },
  ];

  exportToExcel({
    filename,
    columns,
    data: arrears,
    title: 'Arrears Report',
    subtitle: `Generated on ${formatDate(new Date())}`
  });
}

// Client List Export
export function exportClientList(clients: any[], filename: string): void {
  const columns: ExportColumn[] = [
    { key: 'clientCode', header: 'Client Code' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'idNumber', header: 'ID Number' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'dateOfBirth', header: 'Date of Birth', formatter: (v) => v ? formatDate(v) : '' },
    { key: 'gender', header: 'Gender' },
    { key: 'address', header: 'Address' },
    { key: 'registrationDate', header: 'Registration Date', formatter: (v) => v ? formatDate(v) : '' },
    { key: 'status', header: 'Status' },
  ];

  exportToExcel({
    filename,
    columns,
    data: clients,
    title: 'Client List',
    subtitle: `Generated on ${formatDate(new Date())}`
  });
}

// Helper function to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import utilities
export interface ImportResult {
  success: boolean;
  data?: any[];
  errors?: string[];
  rowCount?: number;
}

export function parseCSV(content: string): ImportResult {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { success: false, errors: ['File must contain at least a header row and one data row'] };
    }

    const headers = parseCSVLine(lines[0]);
    const data: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        data.push(row);
      } catch (e) {
        errors.push(`Error parsing row ${i + 1}`);
      }
    }

    return {
      success: true,
      data,
      rowCount: data.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (e) {
    return { success: false, errors: ['Failed to parse CSV file'] };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
