import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuditAction } from '@prisma/client';
import PDFDocument = require('pdfkit');
import { addPdfHeader, addPdfFooter, addSectionTitle, drawSummaryBox, formatCurrency, PDF_CONFIG } from '../common/pdf-utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { QueryPortfolioSummaryDto } from './dto/portfolio-summary.dto';
import { QueryAgingDto, QueryLoansInBucketDto } from './dto/aging.dto';
import {
  QueryAgingExportDto,
  QueryLoansExportDto,
  QueryPortfolioSummaryExportDto,
  ReportExportFormat,
} from './dto/exports.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('portfolio-summary')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Get portfolio summary metrics' })
  @ApiResponse({ status: 200, description: 'Portfolio summary retrieved successfully' })
  getPortfolioSummary(@Query() query: QueryPortfolioSummaryDto) {
    return this.reportsService.getPortfolioSummary(query);
  }

  @Get('portfolio-summary/export')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Export portfolio summary as CSV or PDF' })
  @ApiResponse({ status: 200, description: 'Portfolio summary export generated successfully' })
  async exportPortfolioSummary(
    @Query() query: QueryPortfolioSummaryExportDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const format = query.format || ReportExportFormat.CSV;
    const asOfDate = query.asOfDate || new Date().toISOString().split('T')[0];
    const filenameBase = `portfolio-summary-${asOfDate}`;

    const result = await this.reportsService.getPortfolioSummary(query);

    const ipHeader = (req.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req.ip) || null;
    const userAgent = (req.headers['user-agent'] as string | undefined) || null;

    await this.prisma.auditLog.create({
      data: {
        entity: 'reports',
        entityId: 'portfolio_summary',
        action: AuditAction.CREATE,
        performedBy: user.sub,
        oldValue: undefined,
        newValue: {
          format,
          asOfDate,
        } as any,
        ipAddress: ip,
        userAgent,
      },
    });

    if (format === ReportExportFormat.CSV) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);

      const header = [
        'AsOfDate',
        'ProductId',
        'ProductName',
        'TotalLoans',
        'TotalPrincipalDisbursed',
        'TotalPrincipalOutstanding',
        'TotalInterestOutstanding',
        'TotalFeesOutstanding',
        'TotalPenaltiesOutstanding',
        'TotalOverduePrincipal',
        'TotalOverdueInterest',
        'TotalClosedLoans',
        'TotalWrittenOffLoans',
      ];

      const lines: string[] = [];
      lines.push(header.join(','));
      for (const row of result.rows) {
        lines.push(
          [
            row.asOfDate,
            row.productId ?? '',
            row.productName ?? '',
            row.totalLoans,
            row.totalPrincipalDisbursed,
            row.totalPrincipalOutstanding,
            row.totalInterestOutstanding,
            row.totalFeesOutstanding,
            row.totalPenaltiesOutstanding,
            row.totalOverduePrincipal,
            row.totalOverdueInterest,
            row.totalClosedLoans,
            row.totalWrittenOffLoans,
          ].join(','),
        );
      }

      lines.push('');
      lines.push('KPI,,');
      lines.push(`TotalOutstandingPrincipal,${result.kpis.totalOutstandingPrincipal}`);
      lines.push(`PAR30Amount,${result.kpis.par30Amount}`);
      lines.push(`PAR30Ratio,${result.kpis.par30Ratio}`);
      lines.push(`PAR90Amount,${result.kpis.par90Amount}`);
      lines.push(`PAR90Ratio,${result.kpis.par90Ratio}`);

      res.send(lines.join('\n'));
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    addPdfHeader(doc, 'Portfolio Summary Report');

    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    doc.text(`Report Date: ${asOfDate}`, { align: 'right' });
    doc.moveDown();

    // KPIs Summary Box
    drawSummaryBox(doc, 'KEY PERFORMANCE INDICATORS', [
      { label: 'Outstanding Principal:', value: formatCurrency(result.kpis.totalOutstandingPrincipal) },
      { label: 'PAR 30 Amount:', value: formatCurrency(result.kpis.par30Amount) },
      { label: 'PAR 30 Ratio:', value: `${(result.kpis.par30Ratio * 100).toFixed(2)}%` },
      { label: 'PAR 90 Amount:', value: formatCurrency(result.kpis.par90Amount) },
      { label: 'PAR 90 Ratio:', value: `${(result.kpis.par90Ratio * 100).toFixed(2)}%`, isBold: true },
    ], 40, doc.y, 300);

    doc.moveDown(8);
    addSectionTitle(doc, 'PORTFOLIO BY PRODUCT');

    for (const row of result.rows) {
      doc.font('Helvetica-Bold').fillColor(PDF_CONFIG.primaryColor).text(row.productName || row.productId || 'All Products');
      doc.font('Helvetica').fillColor(PDF_CONFIG.textColor).fontSize(9);
      doc.text(`Total Loans: ${row.totalLoans} | Principal Outstanding: ${formatCurrency(row.totalPrincipalOutstanding)}`);
      doc.text(`Interest: ${formatCurrency(row.totalInterestOutstanding)} | Fees: ${formatCurrency(row.totalFeesOutstanding)} | Penalties: ${formatCurrency(row.totalPenaltiesOutstanding)}`);
      doc.text(`Overdue Principal: ${formatCurrency(row.totalOverduePrincipal)} | Closed: ${row.totalClosedLoans} | Written-off: ${row.totalWrittenOffLoans}`);
      doc.moveDown();
    }

    addPdfFooter(doc);
    doc.end();
  }

  @Get('aging')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Get aging / PAR summary' })
  @ApiResponse({ status: 200, description: 'Aging summary retrieved successfully' })
  getAging(@Query() query: QueryAgingDto) {
    return this.reportsService.getAgingSummary(query);
  }

  @Get('aging/export')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Export aging / PAR report as CSV or PDF' })
  @ApiResponse({ status: 200, description: 'Aging report export generated successfully' })
  async exportAging(
    @Query() query: QueryAgingExportDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const format = query.format || ReportExportFormat.CSV;
    const asOfDate = query.asOfDate || new Date().toISOString().split('T')[0];
    const filenameBase = `aging-${asOfDate}`;

    const result = await this.reportsService.getAgingSummary(query);

    const ipHeader = (req.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req.ip) || null;
    const userAgent = (req.headers['user-agent'] as string | undefined) || null;

    await this.prisma.auditLog.create({
      data: {
        entity: 'reports',
        entityId: 'aging',
        action: AuditAction.CREATE,
        performedBy: user.sub,
        oldValue: undefined,
        newValue: {
          format,
          asOfDate,
        } as any,
        ipAddress: ip,
        userAgent,
      },
    });

    if (format === ReportExportFormat.CSV) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);

      const header = [
        'Bucket',
        'DpdMin',
        'DpdMax',
        'LoansInBucket',
        'PrincipalOutstanding',
        'PrincipalSharePct',
      ];

      const lines: string[] = [];
      lines.push(header.join(','));
      for (const row of result.buckets) {
        lines.push(
          [
            row.bucketLabel,
            row.dpdMin,
            row.dpdMax ?? '',
            row.loansInBucket,
            row.principalOutstanding,
            row.principalSharePct,
          ].join(','),
        );
      }

      lines.push('');
      lines.push('PAR,,');
      lines.push(`PAR30Amount,${result.par.par30Amount}`);
      lines.push(`PAR30Ratio,${result.par.par30Ratio}`);
      lines.push(`PAR90Amount,${result.par.par90Amount}`);
      lines.push(`PAR90Ratio,${result.par.par90Ratio}`);

      res.send(lines.join('\n'));
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    addPdfHeader(doc, 'Aging / PAR Report');

    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    doc.text(`Report Date: ${asOfDate}`, { align: 'right' });
    doc.moveDown();

    // PAR Summary Box
    drawSummaryBox(doc, 'PORTFOLIO AT RISK', [
      { label: 'PAR 30 Amount:', value: formatCurrency(result.par.par30Amount) },
      { label: 'PAR 30 Ratio:', value: `${(result.par.par30Ratio * 100).toFixed(2)}%` },
      { label: 'PAR 90 Amount:', value: formatCurrency(result.par.par90Amount) },
      { label: 'PAR 90 Ratio:', value: `${(result.par.par90Ratio * 100).toFixed(2)}%`, isBold: true },
    ], 40, doc.y, 280);

    doc.moveDown(7);
    addSectionTitle(doc, 'AGING BUCKETS');

    // Table header
    const tableTop = doc.y;
    const tableLeft = 40;
    const colWidths = [100, 80, 80, 120, 100];
    const headers = ['Bucket', 'DPD Range', 'Loans', 'Principal Outstanding', 'Portfolio Share'];
    const rowHeight = 22;

    // Header row
    doc.fillColor(PDF_CONFIG.primaryColor).rect(tableLeft, tableTop, 480, rowHeight).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    let xPos = tableLeft + 5;
    headers.forEach((h, i) => {
      doc.text(h, xPos, tableTop + 6, { width: colWidths[i] - 5 });
      xPos += colWidths[i];
    });

    // Data rows
    let yPos = tableTop + rowHeight;
    result.buckets.forEach((row: any, index: number) => {
      if (index % 2 === 0) {
        doc.fillColor(PDF_CONFIG.lightGray).rect(tableLeft, yPos, 480, rowHeight).fill();
      }
      doc.fillColor(PDF_CONFIG.textColor).font('Helvetica').fontSize(9);
      xPos = tableLeft + 5;
      const rowData = [
        row.bucketLabel,
        `${row.dpdMin} - ${row.dpdMax ?? '+'}`,
        String(row.loansInBucket),
        formatCurrency(row.principalOutstanding),
        `${(row.principalSharePct * 100).toFixed(2)}%`,
      ];
      rowData.forEach((cell, i) => {
        doc.text(cell, xPos, yPos + 6, { width: colWidths[i] - 5 });
        xPos += colWidths[i];
      });
      yPos += rowHeight;
    });

    // Table border
    doc.strokeColor(PDF_CONFIG.borderColor).lineWidth(1).rect(tableLeft, tableTop, 480, yPos - tableTop).stroke();

    addPdfFooter(doc);
    doc.end();
  }

  @Get('loans-in-bucket')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'List loans in a specific DPD bucket' })
  @ApiResponse({ status: 200, description: 'Loans in bucket retrieved successfully' })
  getLoansInBucket(@Query() query: QueryLoansInBucketDto) {
    return this.reportsService.getLoansInBucket(query);
  }

  @Get('loans/export')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Export loans in a specific DPD bucket as CSV or PDF' })
  @ApiResponse({ status: 200, description: 'Loans export generated successfully' })
  async exportLoans(
    @Query() query: QueryLoansExportDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const format = query.format || ReportExportFormat.CSV;
    const asOfDate = query.asOfDate || new Date().toISOString().split('T')[0];
    const filenameBase = `loans-${query.bucket}-${asOfDate}`;

    const result = await this.reportsService.getLoansInBucket(query);

    const ipHeader = (req.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req.ip) || null;
    const userAgent = (req.headers['user-agent'] as string | undefined) || null;

    await this.prisma.auditLog.create({
      data: {
        entity: 'reports',
        entityId: 'loans_in_bucket',
        action: AuditAction.CREATE,
        performedBy: user.sub,
        oldValue: undefined,
        newValue: {
          format,
          asOfDate,
          bucket: query.bucket,
        } as any,
        ipAddress: ip,
        userAgent,
      },
    });

    if (format === ReportExportFormat.CSV) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);

      const header = [
        'LoanId',
        'LoanNumber',
        'ClientName',
        'ProductName',
        'DaysPastDue',
        'Bucket',
        'PrincipalOutstanding',
        'LastPaymentDate',
        'Status',
      ];

      const lines: string[] = [];
      lines.push(header.join(','));
      for (const row of result.data) {
        lines.push(
          [
            row.loanId,
            row.loanNumber,
            row.clientName,
            row.productName,
            row.daysPastDue,
            row.bucketLabel,
            row.principalOutstanding,
            row.lastPaymentDate ?? '',
            row.status,
          ].join(','),
        );
      }

      res.send(lines.join('\n'));
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    addPdfHeader(doc, `Loans in Bucket: ${query.bucket}`);

    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    doc.text(`Report Date: ${asOfDate}`, { align: 'right' });
    doc.text(`Total Loans: ${result.data.length}`, { align: 'right' });
    doc.moveDown();

    // Table
    const tableTop = doc.y;
    const tableLeft = 40;
    const colWidths = [90, 100, 100, 50, 90, 85];
    const headers = ['Loan #', 'Client', 'Product', 'DPD', 'Outstanding', 'Status'];
    const rowHeight = 20;

    // Header
    doc.fillColor(PDF_CONFIG.primaryColor).rect(tableLeft, tableTop, 515, rowHeight).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    let xPos = tableLeft + 3;
    headers.forEach((h, i) => {
      doc.text(h, xPos, tableTop + 5, { width: colWidths[i] - 3 });
      xPos += colWidths[i];
    });

    // Data rows
    let yPos = tableTop + rowHeight;
    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i];
      
      // Page break check
      if (yPos > 750) {
        addPdfFooter(doc);
        doc.addPage();
        yPos = 50;
      }

      if (i % 2 === 0) {
        doc.fillColor(PDF_CONFIG.lightGray).rect(tableLeft, yPos, 515, rowHeight).fill();
      }

      doc.fillColor(PDF_CONFIG.textColor).font('Helvetica').fontSize(8);
      xPos = tableLeft + 3;
      const rowData = [
        row.loanNumber,
        row.clientName?.substring(0, 18) || '',
        row.productName?.substring(0, 18) || '',
        String(row.daysPastDue),
        formatCurrency(row.principalOutstanding),
        row.status,
      ];
      rowData.forEach((cell, idx) => {
        doc.text(cell, xPos, yPos + 5, { width: colWidths[idx] - 3 });
        xPos += colWidths[idx];
      });
      yPos += rowHeight;
    }

    // Table border
    doc.strokeColor(PDF_CONFIG.borderColor).lineWidth(1).rect(tableLeft, tableTop, 515, yPos - tableTop).stroke();

    addPdfFooter(doc);
    doc.end();
  }
}
