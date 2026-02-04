// Clients controller - handles client CRUD and document operations
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  UpdateClientDto,
  QueryClientsDto,
  SubmitKycDto,
  SetProfileEditsAfterKycDto,
  ApproveKycDto,
  RejectKycDto,
  UpdateRiskRatingDto,
  CreateNextOfKinDto,
  UpdateNextOfKinDto,
  CreateRefereeDto,
  UpdateRefereeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ============================================
  // CLIENT CRUD OPERATIONS
  // ============================================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 409, description: 'Client already exists or ID/phone conflict' })
  create(@CurrentUser() user: any, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(user.sub, createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all clients with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  findAll(@Query() query: QueryClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Get('kyc/stats')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Get KYC review statistics' })
  @ApiResponse({ status: 200, description: 'KYC stats retrieved successfully' })
  getKycStats() {
    return this.clientsService.getKycStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/loan-stats')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get loan statistics for a client' })
  @ApiResponse({ status: 200, description: 'Loan stats retrieved successfully' })
  getLoanStats(@Param('id') id: string) {
    return this.clientsService.getLoanStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 409, description: 'ID or phone conflict' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete client' })
  @ApiResponse({ status: 204, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  // ============================================
  // KYC WORKFLOW ENDPOINTS
  // ============================================

  @Post(':id/kyc/submit')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Submit client for KYC review' })
  @ApiResponse({ status: 200, description: 'Client submitted for KYC review' })
  @ApiResponse({ status: 400, description: 'Invalid status for submission' })
  submitForKyc(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitKycDto,
  ) {
    return this.clientsService.submitForKyc(id, user.sub, dto);
  }

  @Post(':id/kyc/approve')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Approve client KYC' })
  @ApiResponse({ status: 200, description: 'KYC approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for approval' })
  approveKyc(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApproveKycDto,
  ) {
    return this.clientsService.approveKyc(id, user.sub, dto);
  }

  @Post(':id/kyc/reject')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Reject client KYC' })
  @ApiResponse({ status: 200, description: 'KYC rejected' })
  @ApiResponse({ status: 400, description: 'Invalid status for rejection' })
  rejectKyc(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectKycDto,
  ) {
    return this.clientsService.rejectKyc(id, user.sub, dto);
  }

  @Patch(':id/kyc/profile-edits')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Allow/disallow client profile edits after KYC approval' })
  @ApiResponse({ status: 200, description: 'Client setting updated successfully' })
  setProfileEditsAfterKyc(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SetProfileEditsAfterKycDto,
  ) {
    return this.clientsService.setProfileEditsAfterKyc(id, user.sub, dto);
  }

  @Get(':id/kyc/history')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get KYC history for a client' })
  @ApiResponse({ status: 200, description: 'KYC history retrieved successfully' })
  getKycHistory(@Param('id') id: string) {
    return this.clientsService.getKycHistory(id);
  }

  @Patch(':id/risk-rating')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update client risk rating' })
  @ApiResponse({ status: 200, description: 'Risk rating updated successfully' })
  updateRiskRating(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRiskRatingDto,
  ) {
    return this.clientsService.updateRiskRating(id, user.sub, dto);
  }

  // ============================================
  // NEXT OF KIN ENDPOINTS
  // ============================================

  @Post(':id/next-of-kin')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Add next of kin' })
  @ApiResponse({ status: 201, description: 'Next of kin added successfully' })
  addNextOfKin(@Param('id') clientId: string, @Body() dto: CreateNextOfKinDto) {
    return this.clientsService.addNextOfKin(clientId, dto);
  }

  @Patch(':id/next-of-kin/:nokId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update next of kin' })
  @ApiResponse({ status: 200, description: 'Next of kin updated successfully' })
  @ApiResponse({ status: 404, description: 'Next of kin not found' })
  updateNextOfKin(
    @Param('id') clientId: string,
    @Param('nokId') nokId: string,
    @Body() dto: UpdateNextOfKinDto,
  ) {
    return this.clientsService.updateNextOfKin(clientId, nokId, dto);
  }

  @Delete(':id/next-of-kin/:nokId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove next of kin' })
  @ApiResponse({ status: 204, description: 'Next of kin removed successfully' })
  @ApiResponse({ status: 404, description: 'Next of kin not found' })
  removeNextOfKin(@Param('id') clientId: string, @Param('nokId') nokId: string) {
    return this.clientsService.removeNextOfKin(clientId, nokId);
  }

  // ============================================
  // REFEREE ENDPOINTS
  // ============================================

  @Post(':id/referees')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Add referee' })
  @ApiResponse({ status: 201, description: 'Referee added successfully' })
  addReferee(@Param('id') clientId: string, @Body() dto: CreateRefereeDto) {
    return this.clientsService.addReferee(clientId, dto);
  }

  @Patch(':id/referees/:refereeId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update referee' })
  @ApiResponse({ status: 200, description: 'Referee updated successfully' })
  @ApiResponse({ status: 404, description: 'Referee not found' })
  updateReferee(
    @Param('id') clientId: string,
    @Param('refereeId') refereeId: string,
    @Body() dto: UpdateRefereeDto,
  ) {
    return this.clientsService.updateReferee(clientId, refereeId, dto);
  }

  @Delete(':id/referees/:refereeId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove referee' })
  @ApiResponse({ status: 204, description: 'Referee removed successfully' })
  @ApiResponse({ status: 404, description: 'Referee not found' })
  removeReferee(@Param('id') clientId: string, @Param('refereeId') refereeId: string) {
    return this.clientsService.removeReferee(clientId, refereeId);
  }

  // ==================== Document Management ====================

  @Post(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'client-documents');
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
  @ApiOperation({ summary: 'Upload a document for a client' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  uploadDocument(
    @Param('id') clientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @CurrentUser() user: any,
  ) {
    return this.clientsService.uploadDocument(clientId, file, documentType, user.sub);
  }

  @Get(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all documents for a client' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  getDocuments(@Param('id') clientId: string) {
    return this.clientsService.getDocuments(clientId);
  }

  @Get(':id/documents/:documentId/download')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Download a client document' })
  @ApiResponse({ status: 200, description: 'Document file' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id') clientId: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const info = await this.clientsService.getDocumentDownloadInfo(clientId, documentId);
    const absolutePath = join(process.cwd(), info.filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Type', info.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${info.fileName}"`);

    return res.sendFile(absolutePath);
  }

  @Delete(':id/documents/:documentId')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  deleteDocument(@Param('id') clientId: string, @Param('documentId') documentId: string) {
    return this.clientsService.deleteDocument(clientId, documentId);
  }

  @Get(':id/timeline')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get client activity timeline' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved successfully' })
  getTimeline(@Param('id') clientId: string) {
    return this.clientsService.getActivityTimeline(clientId);
  }
}
