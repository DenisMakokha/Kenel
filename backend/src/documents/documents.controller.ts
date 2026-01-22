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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'List documents across clients and applications' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  list(@Query() query: QueryDocumentsDto) {
    return this.documentsService.list(query);
  }

  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Download a document file' })
  @ApiProduces('application/octet-stream')
  async download(@Param('id') id: string, @Res() res: Response) {
    const info = await this.documentsService.getDownloadInfo(id);
    const absolute = this.documentsService.resolveAbsolutePath(info.filePath);

    res.setHeader('Content-Type', info.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${info.fileName}"`);

    return res.sendFile(absolute);
  }

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Upload a document for a client or application' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'documents');
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type.'), false);
        }
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.upload(file, user.sub, dto);
  }

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Verify or reject a document' })
  verify(@Param('id') id: string, @Body() dto: VerifyDocumentDto, @CurrentUser() user: JwtPayload) {
    return this.documentsService.verify(id, user.sub, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (soft-delete) a document' })
  async remove(@Param('id') id: string) {
    await this.documentsService.remove(id);
  }
}
