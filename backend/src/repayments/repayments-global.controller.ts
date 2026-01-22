import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFDocument = require('pdfkit');
import { addPdfHeader, addPdfFooter, drawSummaryBox, formatCurrency, PDF_CONFIG } from '../common/pdf-utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RepaymentsService } from './repayments.service';
import { QueryAllRepaymentsDto } from './dto/query-all-repayments.dto';

@ApiTags('Repayments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('repayments')
export class RepaymentsGlobalController {
  constructor(private readonly repaymentsService: RepaymentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'List repayments across all loans (with filters and pagination)' })
  @ApiResponse({ status: 200, description: 'Repayments retrieved successfully' })
  listAll(@Query() query: QueryAllRepaymentsDto) {
    return this.repaymentsService.listAll(query);
  }

  @Get(':repaymentId/receipt')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Download repayment receipt as PDF (global)' })
  @ApiResponse({ status: 200, description: 'Receipt generated successfully' })
  @ApiProduces('application/pdf')
  async getReceipt(@Param('repaymentId') repaymentId: string, @Res() res: Response) {
    const repayment = await this.repaymentsService.getRepaymentForReceiptById(repaymentId);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${repayment.receiptNumber}.pdf"`,
    );

    doc.pipe(res);

    addPdfHeader(doc, 'Payment Receipt');

    const txDate = repayment.transactionDate.toISOString().split('T')[0];

    // Receipt details box
    const boxY = doc.y;
    doc.fillColor('#f0fdf4').rect(40, boxY, 515, 100).fill();
    doc.strokeColor(PDF_CONFIG.primaryColor).lineWidth(2).rect(40, boxY, 515, 100).stroke();

    doc.fontSize(12).font('Helvetica-Bold').fillColor(PDF_CONFIG.primaryColor);
    doc.text(`Receipt No: ${repayment.receiptNumber}`, 60, boxY + 15);
    
    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    doc.text(`Date: ${txDate}`, 60, boxY + 35);
    doc.text(`Loan: ${repayment.loan.loanNumber}`, 60, boxY + 50);
    if (repayment.loan.client) {
      doc.text(`Client: ${repayment.loan.client.firstName} ${repayment.loan.client.lastName} (${repayment.loan.client.clientCode})`, 60, boxY + 65);
    }

    const amountDecimal: any = repayment.amount;
    const amountNum = typeof amountDecimal === 'number' ? amountDecimal : Number(amountDecimal);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(PDF_CONFIG.primaryColor);
    doc.text(formatCurrency(amountNum), 350, boxY + 40);
    doc.fontSize(9).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    doc.text('Amount Paid', 350, boxY + 58);

    doc.moveDown(6);

    // Payment details
    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    doc.text(`Payment Channel: ${repayment.channel}`, 40);
    if (repayment.reference) {
      doc.text(`Reference: ${repayment.reference}`);
    }
    doc.moveDown();

    if (repayment.allocation) {
      const alloc: any = repayment.allocation;
      const principalAmt = typeof alloc.principalAmount === 'number' ? alloc.principalAmount : Number(alloc.principalAmount);
      const interestAmt = typeof alloc.interestAmount === 'number' ? alloc.interestAmount : Number(alloc.interestAmount);
      const feesAmt = typeof alloc.feesAmount === 'number' ? alloc.feesAmount : Number(alloc.feesAmount);
      const penaltiesAmt = typeof alloc.penaltiesAmount === 'number' ? alloc.penaltiesAmount : Number(alloc.penaltiesAmount);
      const totalAmt = typeof alloc.totalAllocated === 'number' ? alloc.totalAllocated : Number(alloc.totalAllocated);

      drawSummaryBox(doc, 'PAYMENT ALLOCATION', [
        { label: 'Principal:', value: formatCurrency(principalAmt) },
        { label: 'Interest:', value: formatCurrency(interestAmt) },
        { label: 'Fees:', value: formatCurrency(feesAmt) },
        { label: 'Penalties:', value: formatCurrency(penaltiesAmt) },
        { label: 'Total Allocated:', value: formatCurrency(totalAmt), isBold: true },
      ], 40, doc.y, 280);
    }

    addPdfFooter(doc);
    doc.end();
  }
}
