import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import PDFDocument = require('pdfkit');
import { addPdfHeader, addPdfFooter, addSectionTitle, drawSummaryBox, formatCurrency, PDF_CONFIG } from '../common/pdf-utils';
import { PrismaService } from '../prisma/prisma.service';
import { PortalService } from './portal.service';
import { PortalClientGuard } from '../portal-auth/portal-client.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RepaymentsService } from '../repayments/repayments.service';
import { CreateNextOfKinDto, CreateRefereeDto, UpdateNextOfKinDto, UpdateRefereeDto } from '../clients/dto';
import { LoanApplicationsService } from '../loan-applications/loan-applications.service';
import { DocumentsService } from '../documents/documents.service';
import { PortalNotificationsService } from './portal-notifications.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

interface PortalRequest extends Request {
  portalClientId?: string;
}

@ApiTags('Portal')
@ApiBearerAuth()
@Public()
@UseGuards(PortalClientGuard)
@Controller('portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly repaymentsService: RepaymentsService,
    private readonly prisma: PrismaService,
    private readonly loanApplicationsService: LoanApplicationsService,
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: PortalNotificationsService,
  ) {}

  // ============================================
  // PORTAL LOAN APPLICATIONS (CLIENT)
  // ============================================

  @Get('loan-applications')
  @ApiOperation({ summary: 'Get all loan applications for current portal client' })
  @ApiResponse({ status: 200, description: 'Loan applications retrieved successfully' })
  async getLoanApplications(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    
    const applications = await this.prisma.loanApplication.findMany({
      where: { clientId },
      include: {
        productVersion: {
          include: {
            loanProduct: true,
          },
        },
        loan: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((app) => ({
      id: app.id,
      status: app.status,
      requestedAmount: app.requestedAmount,
      requestedTermMonths: app.requestedTermMonths,
      purpose: app.purpose,
      productName: app.productVersion?.loanProduct?.name || 'Unknown Product',
      createdAt: app.createdAt,
      submittedAt: app.submittedAt,
      rejectionReason: app.rejectionReason,
      loanId: app.loan?.id || null,
      loanStatus: app.loan?.status || null,
    }));
  }

  @Post('loan-applications')
  @ApiOperation({ summary: 'Create a loan application draft for current portal client' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  async createLoanApplication(
    @Req() req: PortalRequest,
    @Body() body: { productVersionId: string; requestedAmount: number; requestedTermMonths: number; purpose: string },
  ) {
    const clientId = req.portalClientId as string;

    // Create as ONLINE channel draft; use underlying service
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client?.userId) {
      throw new Error('Client user not found');
    }

    return this.loanApplicationsService.create(
      {
        clientId,
        productVersionId: body.productVersionId,
        requestedAmount: body.requestedAmount,
        requestedTermMonths: body.requestedTermMonths,
        purpose: body.purpose,
        channel: 'ONLINE' as any,
      } as any,
      client.userId,
    );
  }

  @Patch('loan-applications/:id')
  @ApiOperation({ summary: 'Update a draft/rejected loan application for current portal client' })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  async updateLoanApplication(
    @Req() req: PortalRequest,
    @Param('id') id: string,
    @Body() body: { requestedAmount?: number; requestedTermMonths?: number; requestedRepaymentFrequency?: string; purpose?: string },
  ) {
    const clientId = req.portalClientId as string;
    const portalUser = (req as any).portalUser as { sub: string } | undefined;

    return this.loanApplicationsService.updateForPortal(id, body as any, clientId, portalUser?.sub || '');
  }

  @Post('loan-applications/:id/submit')
  @ApiOperation({ summary: 'Submit or resubmit (REJECTED → SUBMITTED) a loan application for current portal client' })
  @ApiResponse({ status: 200, description: 'Application submitted successfully' })
  async submitLoanApplication(
    @Req() req: PortalRequest,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    const clientId = req.portalClientId as string;
    const portalUser = (req as any).portalUser as { sub: string } | undefined;
    const result = await this.loanApplicationsService.submitForPortal(id, { notes: body.notes } as any, clientId, portalUser?.sub);
    
    // Create notification for submission
    const application = await this.prisma.loanApplication.findUnique({
      where: { id },
      include: { productVersion: { include: { loanProduct: true } } },
    });
    if (application) {
      await this.notificationsService.notifyApplicationSubmitted(
        clientId,
        application.applicationNumber,
        application.productVersion?.loanProduct?.name || 'Loan',
      );
    }
    
    return result;
  }

  @Get('loan-applications/:id')
  @ApiOperation({ summary: 'Get loan application detail for current portal client' })
  @ApiResponse({ status: 200, description: 'Application details retrieved' })
  async getLoanApplicationDetail(
    @Req() req: PortalRequest,
    @Param('id') id: string,
  ) {
    const clientId = req.portalClientId as string;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    const application = await this.prisma.loanApplication.findFirst({
      where: isUuid
        ? {
            clientId,
            OR: [{ id }, { applicationNumber: id }],
          }
        : {
            clientId,
            applicationNumber: id,
          },
      include: {
        productVersion: {
          include: {
            loanProduct: true,
          },
        },
        checklistItems: true,
        documents: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return {
      id: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
      requestedAmount: application.requestedAmount,
      requestedTermMonths: application.requestedTermMonths,
      purpose: application.purpose,
      productName: application.productVersion?.loanProduct?.name || 'Unknown Product',
      productVersionId: application.productVersionId,
      submittedAt: application.submittedAt,
      approvedPrincipal: application.approvedPrincipal,
      approvedTermMonths: application.approvedTermMonths,
      approvedInterestRate: application.approvedInterestRate,
      rejectionReason: application.rejectionReason,
      rejectionNotes: (application as any).rejectionNotes || null,
      // Return to client fields
      returnReason: application.returnReason,
      returnedAt: application.returnedAt,
      returnedItems: application.returnedItems as any[] || [],
      documents: application.documents.map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt,
        reviewStatus: doc.reviewStatus,
        reviewNotes: doc.reviewNotes,
      })),
      checklistItems: application.checklistItems.map(item => ({
        id: item.id,
        itemKey: item.itemKey,
        itemLabel: item.itemLabel,
        status: item.status,
      })),
    };
  }

  @Delete('loan-applications/:id')
  @ApiOperation({ summary: 'Delete a draft loan application for current portal client' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  async deleteLoanApplication(
    @Req() req: PortalRequest,
    @Param('id') id: string,
  ) {
    const clientId = req.portalClientId as string;
    
    // Check if client KYC is verified - prevent deletion
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (client?.kycStatus === 'VERIFIED') {
      throw new Error('Your account is fully verified. You cannot delete applications. Please contact support.');
    }
    
    // Ensure application belongs to this client and is in DRAFT status
    const application = await this.prisma.loanApplication.findFirst({ 
      where: { id, clientId } 
    });
    
    if (!application) {
      throw new Error('Application not found for this client');
    }
    
    if (application.status !== 'DRAFT') {
      throw new Error('Only draft applications can be deleted');
    }
    
    // Delete associated documents first
    await this.prisma.applicationDocument.deleteMany({
      where: { applicationId: id },
    });
    
    // Delete checklist items
    await this.prisma.loanApplicationChecklistItem.deleteMany({
      where: { loanApplicationId: id },
    });
    
    // Delete events
    await this.prisma.loanApplicationEvent.deleteMany({
      where: { loanApplicationId: id },
    });
    
    // Delete the application
    await this.prisma.loanApplication.delete({
      where: { id },
    });
    
    return { message: 'Application deleted successfully' };
  }

  @Post('loan-applications/:id/documents')
  @ApiOperation({ summary: 'Upload a supporting document for a portal loan application' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'application-documents');
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type.'), false);
        }
      },
    }),
  )
  async uploadLoanApplicationDocument(
    @Req() req: PortalRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type?: string; category?: string },
  ) {
    const clientId = req.portalClientId as string;

    // Ensure application belongs to this client
    const application = await this.prisma.loanApplication.findFirst({ where: { id, clientId } });
    if (!application) {
      throw new BadRequestException('Application not found for this client');
    }

    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client?.userId) {
      throw new BadRequestException('Client user not found');
    }

    return this.documentsService.upload(file, client.userId, {
      type: body.type || 'OTHER',
      category: body.category || 'KYC',
      applicationId: id,
    } as any);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current portal client info' })
  @ApiResponse({ status: 200, description: 'Client info retrieved successfully' })
  async getMe(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    return this.portalService.getMe(clientId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current portal client profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Req() req: PortalRequest,
    @Body() body: { 
      firstName?: string; 
      lastName?: string; 
      email?: string; 
      phonePrimary?: string; 
      residentialAddress?: string;
      employerName?: string;
      occupation?: string;
      monthlyIncome?: string;
    },
  ) {
    const clientId = req.portalClientId as string;
    return this.portalService.updateProfile(clientId, body);
  }

  @Post('me/next-of-kin')
  @ApiOperation({ summary: 'Add next of kin for current portal client' })
  @ApiResponse({ status: 201, description: 'Next of kin added successfully' })
  async addNextOfKin(@Req() req: PortalRequest, @Body() dto: CreateNextOfKinDto) {
    const clientId = req.portalClientId as string;
    return this.portalService.addNextOfKin(clientId, dto);
  }

  @Patch('me/next-of-kin/:nokId')
  @ApiOperation({ summary: 'Update next of kin for current portal client' })
  @ApiResponse({ status: 200, description: 'Next of kin updated successfully' })
  async updateNextOfKin(
    @Req() req: PortalRequest,
    @Param('nokId') nokId: string,
    @Body() dto: UpdateNextOfKinDto,
  ) {
    const clientId = req.portalClientId as string;
    return this.portalService.updateNextOfKin(clientId, nokId, dto);
  }

  @Post('me/referees')
  @ApiOperation({ summary: 'Add referee for current portal client' })
  @ApiResponse({ status: 201, description: 'Referee added successfully' })
  async addReferee(@Req() req: PortalRequest, @Body() dto: CreateRefereeDto) {
    const clientId = req.portalClientId as string;
    return this.portalService.addReferee(clientId, dto);
  }

  @Patch('me/referees/:refereeId')
  @ApiOperation({ summary: 'Update referee for current portal client' })
  @ApiResponse({ status: 200, description: 'Referee updated successfully' })
  async updateReferee(
    @Req() req: PortalRequest,
    @Param('refereeId') refereeId: string,
    @Body() dto: UpdateRefereeDto,
  ) {
    const clientId = req.portalClientId as string;
    return this.portalService.updateReferee(clientId, refereeId, dto);
  }

  @Post('me/referees/:refereeId/delete')
  @ApiOperation({ summary: 'Remove referee for current portal client' })
  @ApiResponse({ status: 200, description: 'Referee removed successfully' })
  async removeReferee(@Req() req: PortalRequest, @Param('refereeId') refereeId: string) {
    const clientId = req.portalClientId as string;
    return this.portalService.removeReferee(clientId, refereeId);
  }

  @Post('me/next-of-kin/:nokId/delete')
  @ApiOperation({ summary: 'Remove next of kin for current portal client' })
  @ApiResponse({ status: 200, description: 'Next of kin removed successfully' })
  async removeNextOfKin(@Req() req: PortalRequest, @Param('nokId') nokId: string) {
    const clientId = req.portalClientId as string;
    return this.portalService.removeNextOfKin(clientId, nokId);
  }

  @Post('me/documents')
  @ApiOperation({ summary: 'Upload a document for current portal client' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'client-documents');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
        }
      },
    }),
  )
  async uploadDocument(
    @Req() req: PortalRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ) {
    const clientId = req.portalClientId as string;
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.portalService.uploadDocument(clientId, file, documentType);
  }

  @Delete('me/documents/:documentId')
  @ApiOperation({ summary: 'Delete a document for current portal client' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  async deleteDocument(
    @Req() req: PortalRequest,
    @Param('documentId') documentId: string,
  ) {
    const clientId = req.portalClientId as string;
    return this.portalService.deleteDocument(clientId, documentId);
  }

  @Post('me/kyc/submit')
  @ApiOperation({ summary: 'Submit KYC for review' })
  @ApiResponse({ status: 200, description: 'KYC submitted for review successfully' })
  @ApiResponse({ status: 400, description: 'KYC incomplete or already submitted' })
  async submitKycForReview(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    const result = await this.portalService.submitKycForReview(clientId);
    
    // Notify credit officers about new KYC submission
    await this.notificationsService.notifyStaffKycSubmitted(clientId);
    
    return result;
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for current portal client' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  async getPreferences(@Req() req: PortalRequest) {
    const portalUser = (req as any).portalUser;
    if (!portalUser?.sub) {
      throw new Error('Unauthorized');
    }
    return this.portalService.getNotificationPreferences(portalUser.sub);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences for current portal client' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(
    @Req() req: PortalRequest,
    @Body() body: { paymentReminders?: boolean; emailNotifications?: boolean; smsNotifications?: boolean },
  ) {
    const portalUser = (req as any).portalUser;
    if (!portalUser?.sub) {
      throw new Error('Unauthorized');
    }
    return this.portalService.updateNotificationPreferences(portalUser.sub, body);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get portal dashboard summary for current client' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    return this.portalService.getDashboard(clientId);
  }

  @Get('products')
  @ApiOperation({ summary: 'List available loan products for portal clients' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getAvailableProducts() {
    return this.portalService.getAvailableLoanProducts();
  }

  @Get('loans')
  @ApiOperation({ summary: 'List loans for current portal client' })
  @ApiResponse({ status: 200, description: 'Loans retrieved successfully' })
  async getLoans(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    return this.portalService.getLoansForClient(clientId);
  }

  @Get('loans/:loanId')
  @ApiOperation({ summary: 'Get loan detail for current portal client' })
  @ApiResponse({ status: 200, description: 'Loan retrieved successfully' })
  async getLoan(@Req() req: PortalRequest, @Param('loanId') loanId: string) {
    const clientId = req.portalClientId as string;
    return this.portalService.getLoanForClient(clientId, loanId);
  }

  @Get('loans/:loanId/schedule')
  @ApiOperation({ summary: 'Get loan schedule for current portal client' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getLoanSchedule(@Req() req: PortalRequest, @Param('loanId') loanId: string) {
    const clientId = req.portalClientId as string;
    return this.portalService.getLoanScheduleForClient(clientId, loanId);
  }

  @Get('loans/:loanId/transactions')
  @ApiOperation({ summary: 'Get loan repayment history for current portal client' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getLoanTransactions(@Req() req: PortalRequest, @Param('loanId') loanId: string) {
    const clientId = req.portalClientId as string;
    return this.portalService.getLoanTransactionsForClient(clientId, loanId);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List client documents for current portal client' })
  @ApiResponse({ status: 200, description: 'Client documents retrieved successfully' })
  async getClientDocuments(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    return this.portalService.getClientDocuments(clientId);
  }

  @Get('loans/:loanId/documents')
  @ApiOperation({ summary: 'List loan documents for a specific loan of current portal client' })
  @ApiResponse({ status: 200, description: 'Loan documents retrieved successfully' })
  async getLoanDocuments(@Req() req: PortalRequest, @Param('loanId') loanId: string) {
    const clientId = req.portalClientId as string;
    return this.portalService.getLoanDocumentsForClient(clientId, loanId);
  }

  @Get('loans/:loanId/statement')
  @ApiOperation({ summary: 'Download loan statement PDF for current portal client' })
  @ApiProduces('application/pdf')
  async downloadStatement(
    @Req() req: PortalRequest,
    @Param('loanId') loanId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const clientId = req.portalClientId as string;
    const portalUser = (req as any).portalUser as { sub: string } | undefined;

    // Ensure the loan belongs to this client and get summary
    const loan = await this.portalService.getLoanForClient(clientId, loanId);
    const client = await this.portalService.getMe(clientId);

    let toDate = to ? new Date(to) : new Date();
    if (Number.isNaN(toDate.getTime())) {
      toDate = new Date();
    }
    toDate.setHours(23, 59, 59, 999);

    let fromDate = from ? new Date(from) : new Date(toDate);
    if (Number.isNaN(fromDate.getTime())) {
      fromDate = new Date(toDate);
    }
    fromDate.setMonth(fromDate.getMonth() - 3);
    fromDate.setHours(0, 0, 0, 0);

    const repayments = await this.portalService.getLoanTransactionsForClient(
      clientId,
      loanId,
      fromDate,
      toDate,
    );

    const ipHeader = (req.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req.ip) || null;
    const userAgent = (req.headers['user-agent'] as string | undefined) || null;

    if (portalUser?.sub) {
      await this.prisma.clientPortalAudit.create({
        data: {
          clientPortalUserId: portalUser.sub,
          eventType: 'statement_download',
          ipAddress: ip,
          userAgent,
        },
      });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="statement-${loan.loanNumber}.pdf"`,
    );

    doc.pipe(res);

    addPdfHeader(doc, 'Loan Statement');

    // Loan details section
    doc.fontSize(10).font('Helvetica').fillColor(PDF_CONFIG.textColor);
    const detailsY = doc.y;
    doc.text(`Loan Number: ${loan.loanNumber}`, 40, detailsY);
    doc.text(`Product: ${loan.productName}`, 40, detailsY + 15);
    doc.text(`Client: ${client.firstName} ${client.lastName} (${client.clientCode})`, 40, detailsY + 30);
    
    const disbursedDate = loan.disbursedAt ? new Date(loan.disbursedAt).toISOString().split('T')[0] : 'N/A';
    doc.text(`Disbursed: ${disbursedDate}`, 300, detailsY);
    doc.text(`Term: ${loan.termMonths || 'N/A'} months`, 300, detailsY + 15);
    const rateNum: any = loan.interestRate;
    const rateStr = rateNum ? (typeof rateNum === 'number' ? rateNum.toFixed(2) : rateNum.toNumber?.().toFixed?.(2) ?? String(rateNum)) : 'N/A';
    doc.text(`Interest Rate: ${rateStr}% p.a.`, 300, detailsY + 30);
    doc.moveDown(3);

    // Summary box
    drawSummaryBox(doc, 'ACCOUNT SUMMARY', [
      { label: 'Original Principal:', value: formatCurrency(loan.principal) },
      { label: 'Current Outstanding:', value: formatCurrency(loan.outstanding), isBold: true },
    ], 40, doc.y, 250);

    doc.moveDown(4);
    doc.fontSize(10).fillColor(PDF_CONFIG.textColor);
    doc.text(`Statement Period: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
    doc.moveDown();

    if (!repayments.length) {
      doc.text('No repayments recorded in this period.');
      addPdfFooter(doc);
      doc.end();
      return;
    }

    addSectionTitle(doc, 'TRANSACTION HISTORY');

    // Table
    const tableTop = doc.y;
    const tableLeft = 40;
    const colWidths = [80, 90, 80, 100, 100];
    const headers = ['Date', 'Amount', 'Channel', 'Reference', 'Receipt #'];
    const rowHeight = 20;

    // Header
    doc.fillColor(PDF_CONFIG.primaryColor).rect(tableLeft, tableTop, 450, rowHeight).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    let xPos = tableLeft + 5;
    headers.forEach((h, i) => {
      doc.text(h, xPos, tableTop + 5, { width: colWidths[i] - 5 });
      xPos += colWidths[i];
    });

    // Sort repayments
    const sortedRepayments = repayments.slice().sort(
      (a: any, b: any) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
    );

    let yPos = tableTop + rowHeight;
    sortedRepayments.forEach((tx: any, index: number) => {
      if (yPos > 750) {
        addPdfFooter(doc);
        doc.addPage();
        yPos = 50;
      }

      if (index % 2 === 0) {
        doc.fillColor(PDF_CONFIG.lightGray).rect(tableLeft, yPos, 450, rowHeight).fill();
      }

      const txDate = new Date(tx.transactionDate).toISOString().split('T')[0];
      const amountDecimal: any = tx.amount;
      const amountNum = typeof amountDecimal === 'number' ? amountDecimal : amountDecimal.toNumber?.() ?? Number(amountDecimal);

      doc.fillColor(PDF_CONFIG.textColor).font('Helvetica').fontSize(9);
      xPos = tableLeft + 5;
      const rowData = [txDate, formatCurrency(amountNum), tx.channel, tx.reference || '-', tx.receiptNumber];
      rowData.forEach((cell, i) => {
        doc.text(cell, xPos, yPos + 5, { width: colWidths[i] - 5 });
        xPos += colWidths[i];
      });
      yPos += rowHeight;
    });

    // Table border
    doc.strokeColor(PDF_CONFIG.borderColor).lineWidth(1).rect(tableLeft, tableTop, 450, yPos - tableTop).stroke();

    addPdfFooter(doc);
    doc.end();
  }

  @Get('loans/:loanId/receipts/:repaymentId')
  @ApiOperation({ summary: 'Download repayment receipt PDF for current portal client' })
  @ApiProduces('application/pdf')
  async downloadReceipt(
    @Req() req: PortalRequest,
    @Param('loanId') loanId: string,
    @Param('repaymentId') repaymentId: string,
    @Res() res: Response,
  ) {
    const clientId = req.portalClientId as string;
    const portalUser = (req as any).portalUser as { sub: string } | undefined;

    // Ensure the loan belongs to this client
    await this.portalService.getLoanForClient(clientId, loanId);

    const repayment = await this.repaymentsService.getRepaymentForReceipt(loanId, repaymentId as any);

    const ipHeader = (req.headers['x-forwarded-for'] as string | undefined) || undefined;
    const ip = (ipHeader ? ipHeader.split(',')[0].trim() : req.ip) || null;
    const userAgent = (req.headers['user-agent'] as string | undefined) || null;

    if (portalUser?.sub) {
      await this.prisma.clientPortalAudit.create({
        data: {
          clientPortalUserId: portalUser.sub,
          eventType: 'receipt_download',
          ipAddress: ip,
          userAgent,
        },
      });
    }

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

  // ============================================
  // NOTIFICATIONS
  // ============================================

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications for current portal client' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    const notifications = await this.notificationsService.getNotifications(clientId);
    const unreadCount = await this.notificationsService.getUnreadCount(clientId);
    return { notifications, unreadCount };
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markNotificationAsRead(
    @Req() req: PortalRequest,
    @Param('id') notificationId: string,
  ) {
    const clientId = req.portalClientId as string;
    await this.notificationsService.markAsRead(clientId, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllNotificationsAsRead(@Req() req: PortalRequest) {
    const clientId = req.portalClientId as string;
    await this.notificationsService.markAllAsRead(clientId);
    return { message: 'All notifications marked as read' };
  }

  @Delete('notifications/:id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(
    @Req() req: PortalRequest,
    @Param('id') notificationId: string,
  ) {
    const clientId = req.portalClientId as string;
    await this.notificationsService.deleteNotification(clientId, notificationId);
    return { message: 'Notification deleted' };
  }
}
