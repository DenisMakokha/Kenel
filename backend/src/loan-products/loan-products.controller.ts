import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFDocument = require('pdfkit');
import { addPdfHeader, addPdfFooter, drawSummaryBox, PDF_CONFIG } from '../common/pdf-utils';
import { LoanProductsService } from './loan-products.service';
import {
  CreateLoanProductDto,
  UpdateLoanProductDto,
  CreateProductVersionDto,
  UpdateProductVersionDto,
  QueryProductsDto,
  QueryVersionsDto,
  PreviewScheduleDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Loan Products')
@Controller('loan-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoanProductsController {
  constructor(private readonly loanProductsService: LoanProductsService) {}

  // ============================================
  // PRODUCT ENDPOINTS
  // ============================================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Create a new loan product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product code already exists' })
  createProduct(@Body() dto: CreateLoanProductDto, @CurrentUser() user: any) {
    return this.loanProductsService.createProduct(dto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all loan products with filters' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  getProducts(@Query() query: QueryProductsDto) {
    return this.loanProductsService.getProducts(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get single loan product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProduct(@Param('id') id: string) {
    return this.loanProductsService.getProduct(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update loan product metadata' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateLoanProductDto,
    @CurrentUser() user: any,
  ) {
    return this.loanProductsService.updateProduct(id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete loan product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.loanProductsService.deleteProduct(id, user.sub);
  }

  // ============================================
  // VERSION ENDPOINTS
  // ============================================

  @Get(':productId/versions')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all versions for a product' })
  @ApiResponse({ status: 200, description: 'Versions retrieved successfully' })
  getVersions(@Param('productId') productId: string, @Query() query: QueryVersionsDto) {
    return this.loanProductsService.getVersions(productId, query);
  }

  @Post(':productId/versions')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Create a new version (draft)' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Version number already exists' })
  createVersion(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVersionDto,
    @CurrentUser() user: any,
  ) {
    return this.loanProductsService.createVersion(productId, dto, user.sub);
  }

  @Get(':productId/versions/:versionId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get single version by ID' })
  @ApiResponse({ status: 200, description: 'Version retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  getVersion(@Param('productId') productId: string, @Param('versionId') versionId: string) {
    return this.loanProductsService.getVersion(productId, versionId);
  }

  @Patch(':productId/versions/:versionId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update version (only DRAFT)' })
  @ApiResponse({ status: 200, description: 'Version updated successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT versions can be updated' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  updateVersion(
    @Param('productId') productId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateProductVersionDto,
    @CurrentUser() user: any,
  ) {
    return this.loanProductsService.updateVersion(productId, versionId, dto, user.sub);
  }

  @Post(':productId/versions/:versionId/publish')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish a version' })
  @ApiResponse({ status: 200, description: 'Version published successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT versions can be published' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  publishVersion(
    @Param('productId') productId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: any,
  ) {
    return this.loanProductsService.publishVersion(productId, versionId, user.sub);
  }

  @Post(':productId/versions/:versionId/retire')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retire a published version' })
  @ApiResponse({ status: 200, description: 'Version retired successfully' })
  @ApiResponse({ status: 400, description: 'Only PUBLISHED versions can be retired' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  retireVersion(
    @Param('productId') productId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: any,
  ) {
    return this.loanProductsService.retireVersion(productId, versionId, user.sub);
  }

  @Post(':productId/versions/:versionId/preview-schedule')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Preview loan schedule for a version' })
  @ApiResponse({ status: 200, description: 'Schedule preview generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  previewSchedule(
    @Param('productId') productId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PreviewScheduleDto,
  ) {
    return this.loanProductsService.previewSchedule(productId, versionId, dto);
  }

  @Post(':productId/versions/:versionId/preview-schedule/pdf')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Download loan schedule preview as PDF for a version' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiProduces('application/pdf')
  async previewSchedulePdf(
    @Param('productId') productId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PreviewScheduleDto,
    @Res() res: Response,
  ) {
    const schedule = await this.loanProductsService.previewSchedule(productId, versionId, dto);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="schedule-${schedule.productName}-${schedule.versionNumber}.pdf"`,
    );

    doc.pipe(res);

    addPdfHeader(doc, 'Loan Repayment Schedule');

    // Loan Details Box
    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    const detailsY = doc.y;
    doc.text(`Product: ${schedule.productName}`, 40, detailsY);
    doc.text(`Currency: ${schedule.currency}`, 40, detailsY + 15);
    doc.text(`Version: ${schedule.versionNumber}`, 40, detailsY + 30);
    doc.text(`Principal: ${schedule.currency} ${dto.principal.toLocaleString()}`, 300, detailsY);
    doc.text(`Term: ${dto.term_months} months`, 300, detailsY + 15);
    doc.text(`Start Date: ${dto.start_date}`, 300, detailsY + 30);
    doc.moveDown(3);

    // Table Configuration
    const tableTop = doc.y + 10;
    const tableLeft = 40;
    const colWidths = [30, 75, 75, 65, 55, 75, 80];
    const headers = ['#', 'Due Date', 'Principal', 'Interest', 'Fees', 'Total Due', 'Balance'];
    const rowHeight = 20;

    // Draw table header background
    doc.fillColor(PDF_CONFIG.primaryColor).rect(tableLeft, tableTop, 515, rowHeight).fill();

    // Draw header text
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    let xPos = tableLeft + 5;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop + 5, { width: colWidths[i] - 5, align: i === 0 ? 'left' : 'right' });
      xPos += colWidths[i];
    });

    // Draw table rows
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    let yPos = tableTop + rowHeight;

    schedule.installments.forEach((inst: any, index: number) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.fillColor(PDF_CONFIG.lightGray).rect(tableLeft, yPos, 515, rowHeight).fill();
      }

      // Check for page break
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }

      doc.fillColor(PDF_CONFIG.textColor);
      xPos = tableLeft + 5;
      const rowData = [
        String(inst.number),
        inst.due_date,
        inst.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        inst.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        inst.fees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        inst.total_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        inst.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];

      rowData.forEach((data, i) => {
        doc.text(data, xPos, yPos + 5, { width: colWidths[i] - 5, align: i === 0 ? 'left' : 'right' });
        xPos += colWidths[i];
      });

      yPos += rowHeight;
    });

    // Draw table border
    doc.strokeColor(PDF_CONFIG.borderColor).lineWidth(1);
    doc.rect(tableLeft, tableTop, 515, yPos - tableTop).stroke();

    // Summary Section
    doc.moveDown(2);
    const summaryY = yPos + 20;
    const currency = schedule.currency;
    drawSummaryBox(doc, 'SUMMARY', [
      { label: 'Total Principal:', value: `${currency} ${schedule.totals.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { label: 'Total Interest:', value: `${currency} ${schedule.totals.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { label: 'Total Fees:', value: `${currency} ${schedule.totals.fees.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { label: 'Total Payable:', value: `${currency} ${schedule.totals.total_payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, isBold: true },
    ], tableLeft, summaryY, 280);

    addPdfFooter(doc);
    doc.end();
  }

  // ============================================
  // AUDIT ENDPOINTS
  // ============================================

  @Get(':productId/audit-logs')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Get audit logs for a product' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  getAuditLogs(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loanProductsService.getAuditLogs(productId, page, limit);
  }
}
