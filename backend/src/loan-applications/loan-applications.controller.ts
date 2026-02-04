import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoanApplicationsService } from './loan-applications.service';
import {
  ApproveLoanApplicationDto,
  BulkApproveLoanApplicationsDto,
  CreateLoanApplicationDto,
  BulkRejectLoanApplicationsDto,
  QueryLoanApplicationsDto,
  RejectLoanApplicationDto,
  SubmitLoanApplicationDto,
  UpdateChecklistItemDto,
  UpdateLoanApplicationDto,
  UpsertCreditScoreDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Loan Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loan-applications')
export class LoanApplicationsController {
  constructor(private readonly loanApplicationsService: LoanApplicationsService) {}

  // ============================================
  // CORE APPLICATION ENDPOINTS
  // ============================================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Create a new loan application (draft)' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  create(
    @Body() dto: CreateLoanApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.create(dto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'List loan applications with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  findAll(@Query() query: QueryLoanApplicationsDto) {
    return this.loanApplicationsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get full loan application detail' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(@Param('id') id: string) {
    return this.loanApplicationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update draft loan application' })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT applications can be updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLoanApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.update(id, dto, user.sub, user.role);
  }

  // ============================================
  // WORKFLOW ENDPOINTS
  // ============================================

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Submit a draft application' })
  @ApiResponse({ status: 200, description: 'Application submitted successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT applications can be submitted' })
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitLoanApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.submit(id, dto, user.sub);
  }

  @Post(':id/move-to-under-review')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Move a submitted application to UNDER_REVIEW' })
  @ApiResponse({ status: 200, description: 'Application moved to UNDER_REVIEW' })
  @ApiResponse({ status: 400, description: 'Only SUBMITTED applications can be moved' })
  moveToUnderReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.moveToUnderReview(id, user.sub);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve an application' })
  @ApiResponse({ status: 200, description: 'Application approved successfully' })
  @ApiResponse({ status: 400, description: 'Only UNDER_REVIEW applications can be approved' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveLoanApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.approve(id, dto, user.sub);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject an application' })
  @ApiResponse({ status: 200, description: 'Application rejected successfully' })
  @ApiResponse({ status: 400, description: 'Only UNDER_REVIEW applications can be rejected' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectLoanApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.reject(id, dto, user.sub);
  }

  @Post(':id/return')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Return application to client for corrections' })
  @ApiResponse({ status: 200, description: 'Application returned to client' })
  @ApiResponse({ status: 400, description: 'Only SUBMITTED or UNDER_REVIEW applications can be returned' })
  returnToClient(
    @Param('id') id: string,
    @Body() dto: { reason: string; returnedItems: Array<{ type: string; documentType?: string; field?: string; message: string }> },
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.returnToClient(id, dto, user.sub);
  }

  @Post('bulk/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk approve applications (ADMIN only)' })
  bulkApprove(@Body() dto: BulkApproveLoanApplicationsDto, @CurrentUser() user: any) {
    return this.loanApplicationsService.bulkApprove(dto, user.sub);
  }

  @Post('bulk/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk reject applications (ADMIN only)' })
  bulkReject(@Body() dto: BulkRejectLoanApplicationsDto, @CurrentUser() user: any) {
    return this.loanApplicationsService.bulkReject(dto, user.sub);
  }

  // ============================================
  // CREDIT SCORING
  // ============================================

  @Post(':id/score')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Capture or update manual credit score for an application' })
  @ApiResponse({ status: 200, description: 'Score saved successfully' })
  upsertScore(
    @Param('id') id: string,
    @Body() dto: UpsertCreditScoreDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.upsertScore(id, dto, user.sub);
  }

  // ============================================
  // CHECKLIST
  // ============================================

  @Get(':id/checklist')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get checklist items for an application' })
  getChecklist(@Param('id') id: string) {
    return this.loanApplicationsService.getChecklist(id);
  }

  @Patch(':id/checklist/:itemId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update a checklist item' })
  updateChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.updateChecklistItem(id, itemId, dto, user.sub);
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  @Post(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
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
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
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
          cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a document for an application' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.uploadDocument(id, file, documentType, user.sub);
  }

  @Get(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all documents for an application' })
  getDocuments(@Param('id') id: string) {
    return this.loanApplicationsService.getDocuments(id);
  }

  @Get(':id/documents/:documentId/download')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Download an application document' })
  async downloadDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const doc = await this.loanApplicationsService.getDocumentById(id, documentId);
    if (!doc || !doc.filePath) {
      throw new NotFoundException('Document not found');
    }

    const filePath = join(process.cwd(), doc.filePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on server');
    }

    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Delete(':id/documents/:documentId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application document' })
  deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.loanApplicationsService.deleteDocument(id, documentId);
  }

  @Patch(':id/documents/:documentId/review')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Review (approve/reject) an application document' })
  @ApiResponse({ status: 200, description: 'Document reviewed successfully' })
  reviewDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED'; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.loanApplicationsService.reviewDocument(id, documentId, body.status, body.notes, user.sub);
  }

  // ============================================
  // EVENTS / AUDIT
  // ============================================

  @Get(':id/events')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get application events (timeline)' })
  getEvents(@Param('id') id: string) {
    return this.loanApplicationsService.getEvents(id);
  }
}
