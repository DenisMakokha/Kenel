import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentReviewStatus, DocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { join } from 'path';
import { existsSync } from 'fs';

type UnifiedId = string;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private encodeId(kind: 'c' | 'a', id: string): UnifiedId {
    return `${kind}_${id}`;
  }

  private decodeId(unifiedId: string): { kind: 'c' | 'a'; id: string } {
    if (!unifiedId || typeof unifiedId !== 'string') {
      throw new BadRequestException('Invalid document id');
    }

    const [kind, ...rest] = unifiedId.split('_');
    const id = rest.join('_');
    if ((kind !== 'c' && kind !== 'a') || !id) {
      throw new BadRequestException('Invalid document id');
    }
    return { kind, id };
  }

  async list(query: QueryDocumentsDto) {
    const {
      search,
      category,
      type,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = query;

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const uploadedAtFilter: Prisma.DateTimeFilter | undefined =
      fromDate || toDate
        ? {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {}),
          }
        : undefined;

    const reviewStatus = status ? (status as DocumentReviewStatus) : undefined;

    const normalizedType = type ? this.normalizeDocumentType(type) : undefined;

    const clientWhere: Prisma.ClientDocumentWhereInput = {
      isDeleted: false,
      ...(category ? { category } : {}),
      ...(normalizedType ? { documentType: normalizedType } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
      ...(uploadedAtFilter ? { uploadedAt: uploadedAtFilter } : {}),
    };

    if (search && search.trim()) {
      const q = search.trim();
      clientWhere.OR = [
        { fileName: { contains: q, mode: 'insensitive' } },
        { client: { firstName: { contains: q, mode: 'insensitive' } } },
        { client: { lastName: { contains: q, mode: 'insensitive' } } },
        { client: { clientCode: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const appWhere: Prisma.ApplicationDocumentWhereInput = {
      isDeleted: false,
      ...(category ? { category } : {}),
      ...(normalizedType ? { documentType: normalizedType } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
      ...(uploadedAtFilter ? { uploadedAt: uploadedAtFilter } : {}),
    };

    if (search && search.trim()) {
      const q = search.trim();
      appWhere.OR = [
        { fileName: { contains: q, mode: 'insensitive' } },
        { application: { applicationNumber: { contains: q, mode: 'insensitive' } } },
        { application: { client: { firstName: { contains: q, mode: 'insensitive' } } } },
        { application: { client: { lastName: { contains: q, mode: 'insensitive' } } } },
        { application: { client: { clientCode: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [clientTotal, appTotal] = await Promise.all([
      this.prisma.clientDocument.count({ where: clientWhere }),
      this.prisma.applicationDocument.count({ where: appWhere }),
    ]);

    const overFetch = skip + take;

    const [clientDocs, appDocs] = await Promise.all([
      this.prisma.clientDocument.findMany({
        where: clientWhere,
        orderBy: { uploadedAt: 'desc' },
        take: overFetch,
        include: {
          client: {
            select: { id: true, clientCode: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.applicationDocument.findMany({
        where: appWhere,
        orderBy: { uploadedAt: 'desc' },
        take: overFetch,
        include: {
          application: {
            select: {
              id: true,
              applicationNumber: true,
              client: { select: { id: true, clientCode: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const unified = [
      ...clientDocs.map((d) => {
        const row: any = d as any;
        return {
        id: this.encodeId('c', d.id),
        name: d.fileName,
        type: d.documentType,
        category: row.category || 'OTHER',
        mimeType: d.mimeType,
        size: d.sizeBytes,
        url: `/documents/${this.encodeId('c', d.id)}/download`,
        status: row.reviewStatus,
        clientId: d.clientId,
        clientName: d.client ? `${d.client.firstName} ${d.client.lastName}` : undefined,
        loanId: undefined,
        uploadedBy: d.uploadedBy,
        uploadedByName: 'System',
        createdAt: d.uploadedAt.toISOString(),
        verifiedAt: row.reviewedAt ? row.reviewedAt.toISOString() : undefined,
        verifiedBy: row.reviewedBy || undefined,
        notes: row.reviewNotes || undefined,
        source: 'client' as const,
        };
      }),
      ...appDocs.map((d) => {
        const row: any = d as any;
        return {
        id: this.encodeId('a', d.id),
        name: d.fileName,
        type: d.documentType,
        category: row.category || 'OTHER',
        mimeType: d.mimeType,
        size: d.fileSize,
        url: `/documents/${this.encodeId('a', d.id)}/download`,
        status: row.reviewStatus,
        clientId: d.application?.client?.id,
        clientName: d.application?.client ? `${d.application.client.firstName} ${d.application.client.lastName}` : undefined,
        loanId: undefined,
        uploadedBy: row.uploadedBy || '',
        uploadedByName: 'System',
        createdAt: d.uploadedAt.toISOString(),
        verifiedAt: row.reviewedAt ? row.reviewedAt.toISOString() : undefined,
        verifiedBy: row.reviewedBy || undefined,
        notes: row.reviewNotes || undefined,
        source: 'application' as const,
        };
      }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageItems = unified.slice(skip, skip + take);

    return {
      documents: pageItems,
      total: clientTotal + appTotal,
    };
  }

  async verify(unifiedId: string, userId: string, dto: VerifyDocumentDto) {
    const { kind, id } = this.decodeId(unifiedId);
    const status = dto.status === 'VERIFIED' ? DocumentReviewStatus.VERIFIED : DocumentReviewStatus.REJECTED;

    if (kind === 'c') {
      const existing = await this.prisma.clientDocument.findFirst({ where: { id, isDeleted: false } });
      if (!existing) throw new NotFoundException('Document not found');

      await this.prisma.clientDocument.update({
        where: { id },
        data: {
          reviewStatus: status,
          reviewNotes: dto.notes ?? null,
          reviewedAt: new Date(),
          reviewedBy: userId,
        },
      });
      return { message: 'Document updated' };
    }

    const existing = await this.prisma.applicationDocument.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new NotFoundException('Document not found');

    await this.prisma.applicationDocument.update({
      where: { id },
      data: {
        reviewStatus: status,
        reviewNotes: dto.notes ?? null,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    return { message: 'Document updated' };
  }

  async remove(unifiedId: string) {
    const { kind, id } = this.decodeId(unifiedId);

    if (kind === 'c') {
      const existing = await this.prisma.clientDocument.findFirst({ where: { id, isDeleted: false } });
      if (!existing) throw new NotFoundException('Document not found');
      await this.prisma.clientDocument.update({ where: { id }, data: { isDeleted: true } });
      return;
    }

    const existing = await this.prisma.applicationDocument.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new NotFoundException('Document not found');
    await this.prisma.applicationDocument.update({ where: { id }, data: { isDeleted: true } });
  }

  async getDownloadInfo(unifiedId: string) {
    const { kind, id } = this.decodeId(unifiedId);

    if (kind === 'c') {
      const doc = await this.prisma.clientDocument.findFirst({ where: { id, isDeleted: false } });
      if (!doc) throw new NotFoundException('Document not found');
      return {
        filePath: doc.filePath,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
      };
    }

    const doc = await this.prisma.applicationDocument.findFirst({ where: { id, isDeleted: false } });
    if (!doc) throw new NotFoundException('Document not found');
    return {
      filePath: doc.filePath,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
    };
  }

  async upload(file: Express.Multer.File, userId: string, dto: UploadDocumentDto) {
    const hasClient = Boolean(dto.clientId);
    const hasApplication = Boolean(dto.applicationId);

    if ((hasClient && hasApplication) || (!hasClient && !hasApplication)) {
      throw new BadRequestException('Provide either clientId or applicationId');
    }

    const documentType = this.normalizeDocumentType(dto.type);

    if (hasClient) {
      await this.prisma.client.findUnique({ where: { id: dto.clientId! } }).then((c) => {
        if (!c) throw new NotFoundException('Client not found');
      });

      const created = await this.prisma.clientDocument.create({
        data: {
          clientId: dto.clientId!,
          documentType,
          category: dto.category,
          fileName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedBy: userId,
          virusScanStatus: 'pending',
          reviewStatus: DocumentReviewStatus.PENDING,
          reviewNotes: dto.notes ?? null,
        },
      });

      return { id: this.encodeId('c', created.id) };
    }

    await this.prisma.loanApplication.findUnique({ where: { id: dto.applicationId! } }).then((a) => {
      if (!a) throw new NotFoundException('Application not found');
    });

    const created = await this.prisma.applicationDocument.create({
      data: {
        applicationId: dto.applicationId!,
        documentType,
        category: dto.category,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
        reviewStatus: DocumentReviewStatus.PENDING,
        reviewNotes: dto.notes ?? null,
      },
    });

    return { id: this.encodeId('a', created.id) };
  }

  private normalizeDocumentType(input: string): DocumentType {
    const raw = (input || '').toString().trim().toUpperCase();

    // Frontend legacy mapping
    const mapped = raw === 'UTILITY_BILL' ? 'PROOF_OF_RESIDENCE' : raw;

    if (!Object.values(DocumentType).includes(mapped as any)) {
      throw new BadRequestException('Invalid document type');
    }

    return mapped as DocumentType;
  }

  resolveAbsolutePath(filePath: string) {
    const absolute = filePath.startsWith('uploads') ? join(process.cwd(), filePath) : filePath;
    if (!existsSync(absolute)) {
      throw new NotFoundException('File not found');
    }
    return absolute;
  }
}
