import PDFDocument = require('pdfkit');

// Company branding configuration
export const PDF_CONFIG = {
  companyName: process.env.COMPANY_NAME || 'Kenels Bureau Ltd',
  companyEmail: process.env.COMPANY_EMAIL || 'support@kenelsbureau.co.ke',
  companyPhone: process.env.COMPANY_PHONE || '+254 759 599 124',
  companyAddress: process.env.COMPANY_ADDRESS || 'Eaton Place, 2nd Floor, United Nations Crescent, Nairobi-Kenya',
  primaryColor: '#047857',
  secondaryColor: '#1e293b',
  lightGray: '#f8fafc',
  borderColor: '#e2e8f0',
  textColor: '#334155',
  mutedColor: '#94a3b8',
};

/**
 * Add branded header to a PDF document
 */
export function addPdfHeader(doc: typeof PDFDocument, title: string): void {
  const { companyName, companyEmail, companyPhone, companyAddress, primaryColor } = PDF_CONFIG;

  // Company name
  doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryColor).text(companyName, { align: 'center' });
  
  // Company address and contact
  doc.fontSize(9).font('Helvetica').fillColor('#666666').text(companyAddress, { align: 'center' });
  doc.text(`Tel: ${companyPhone} | Email: ${companyEmail}`, { align: 'center' });
  doc.moveDown(0.5);

  // Divider line
  doc.strokeColor(primaryColor).lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  // Document title
  doc.fontSize(14).font('Helvetica-Bold').fillColor(PDF_CONFIG.secondaryColor).text(title.toUpperCase(), { align: 'center' });
  doc.moveDown(1);
}

/**
 * Add footer to a PDF document
 */
export function addPdfFooter(doc: typeof PDFDocument): void {
  const { companyEmail, mutedColor } = PDF_CONFIG;
  const pageHeight = doc.page.height;

  doc.fontSize(8).font('Helvetica').fillColor(mutedColor);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    40,
    pageHeight - 50,
    { align: 'center', width: 515 },
  );
  doc.text(
    `This is a computer-generated document. For inquiries, contact ${companyEmail}`,
    40,
    pageHeight - 38,
    { align: 'center', width: 515 },
  );
}

/**
 * Draw a table header row
 */
export function drawTableHeader(
  doc: typeof PDFDocument,
  headers: string[],
  colWidths: number[],
  tableLeft: number,
  tableTop: number,
  rowHeight: number = 20,
): void {
  const { primaryColor } = PDF_CONFIG;

  // Header background
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  doc.fillColor(primaryColor).rect(tableLeft, tableTop, totalWidth, rowHeight).fill();

  // Header text
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  let xPos = tableLeft + 5;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop + 5, { width: colWidths[i] - 5, align: i === 0 ? 'left' : 'right' });
    xPos += colWidths[i];
  });
}

/**
 * Draw a table row
 */
export function drawTableRow(
  doc: typeof PDFDocument,
  data: string[],
  colWidths: number[],
  tableLeft: number,
  yPos: number,
  rowHeight: number = 20,
  isAlternate: boolean = false,
): void {
  const { lightGray, textColor } = PDF_CONFIG;

  // Alternate row background
  if (isAlternate) {
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    doc.fillColor(lightGray).rect(tableLeft, yPos, totalWidth, rowHeight).fill();
  }

  // Row text
  doc.fillColor(textColor).font('Helvetica').fontSize(9);
  let xPos = tableLeft + 5;
  data.forEach((cell, i) => {
    doc.text(cell, xPos, yPos + 5, { width: colWidths[i] - 5, align: i === 0 ? 'left' : 'right' });
    xPos += colWidths[i];
  });
}

/**
 * Draw a summary box with key-value pairs
 */
export function drawSummaryBox(
  doc: typeof PDFDocument,
  title: string,
  items: { label: string; value: string; isBold?: boolean }[],
  x: number,
  y: number,
  width: number = 250,
): number {
  const { primaryColor, secondaryColor, textColor } = PDF_CONFIG;
  const padding = 10;
  const lineHeight = 15;
  const boxHeight = padding * 2 + items.length * lineHeight + 5;

  // Title
  doc.fontSize(11).font('Helvetica-Bold').fillColor(secondaryColor).text(title, x, y);
  const boxY = y + 20;

  // Box background and border
  doc.fillColor('#f0fdf4').rect(x, boxY, width, boxHeight).fill();
  doc.strokeColor(primaryColor).rect(x, boxY, width, boxHeight).stroke();

  // Items
  let itemY = boxY + padding;
  items.forEach((item) => {
    if (item.isBold) {
      doc.font('Helvetica-Bold').fillColor(primaryColor);
    } else {
      doc.font('Helvetica').fillColor(textColor);
    }
    doc.fontSize(10);
    doc.text(item.label, x + padding, itemY);
    doc.text(item.value, x + 120, itemY);
    itemY += lineHeight;
  });

  return boxY + boxHeight;
}

/**
 * Add a section title
 */
export function addSectionTitle(doc: typeof PDFDocument, title: string): void {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(PDF_CONFIG.secondaryColor).text(title);
  doc.moveDown(0.5);
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number | string, currency: string = 'KES'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `${currency} 0.00`;
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}
