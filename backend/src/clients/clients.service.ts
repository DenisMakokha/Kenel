import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { DocumentType } from '@prisma/client';
import {
  CreateClientDto,
  UpdateClientDto,
  QueryClientsDto,
  SubmitKycDto,
  ApproveKycDto,
  SetProfileEditsAfterKycDto,
  RejectKycDto,
  UpdateRiskRatingDto,
  CreateNextOfKinDto,
  UpdateNextOfKinDto,
  CreateRefereeDto,
  UpdateRefereeDto,
} from './dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique client code
   */
  private async generateClientCode(): Promise<string> {
    const count = await this.prisma.client.count();
    const code = `CL-${String(count + 1).padStart(6, '0')}`;
    
    // Check if code exists (rare collision)
    const exists = await this.prisma.client.findUnique({
      where: { clientCode: code },
    });
    
    if (exists) {
      // Retry with timestamp
      return `CL-${String(count + 1).padStart(6, '0')}-${Date.now()}`;
    }
    
    return code;
  }

  /**
   * Create a new client (auto-creates user account if needed)
   */
  async create(createdByUserId: string, createClientDto: CreateClientDto) {
    // Check if ID number is already used
    const existingId = await this.prisma.client.findUnique({
      where: { idNumber: createClientDto.idNumber },
    });

    if (existingId) {
      throw new ConflictException('ID number already registered');
    }

    // Check if primary phone is already used
    const existingPhone = await this.prisma.client.findFirst({
      where: { phonePrimary: createClientDto.phonePrimary },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Check if email is already used (if provided)
    if (createClientDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createClientDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    const clientCode = await this.generateClientCode();

    // Generate a temporary email if not provided
    const userEmail = createClientDto.email || `${createClientDto.idNumber}@temp.kenelsbureau.co.ke`;
    
    // Generate a default password (ID number + first 4 chars of phone)
    const defaultPassword = `${createClientDto.idNumber}${createClientDto.phonePrimary.slice(-4)}`;
    const passwordHash = await argon2.hash(defaultPassword);

    // Create user and client in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user account for the client
      const user = await tx.user.create({
        data: {
          email: userEmail,
          password: passwordHash,
          firstName: createClientDto.firstName,
          lastName: createClientDto.lastName,
          phone: createClientDto.phonePrimary,
          role: 'CLIENT',
          isActive: true,
          emailVerified: false,
        },
      });

      // Create client record
      const client = await tx.client.create({
        data: {
          clientCode,
          userId: user.id,
          firstName: createClientDto.firstName,
          lastName: createClientDto.lastName,
          otherNames: createClientDto.otherNames,
          idType: createClientDto.idType,
          idNumber: createClientDto.idNumber,
          dateOfBirth: new Date(createClientDto.dateOfBirth),
          gender: createClientDto.gender,
          maritalStatus: createClientDto.maritalStatus,
          phonePrimary: createClientDto.phonePrimary,
          phoneSecondary: createClientDto.phoneSecondary,
          email: createClientDto.email,
          residentialAddress: createClientDto.residentialAddress,
          employerName: createClientDto.employerName,
          employerAddress: createClientDto.employerAddress,
          employerPhone: createClientDto.employerPhone,
          occupation: createClientDto.occupation,
          monthlyIncome: createClientDto.monthlyIncome,
          createdChannel: createClientDto.createdChannel || 'BRANCH',
          notes: createClientDto.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // Create portal user for self-service access
      await tx.clientPortalUser.create({
        data: {
          clientId: client.id,
          email: userEmail,
          passwordHash,
          status: 'active',
        },
      });

      return client;
    });

    return result;
  }

  /**
   * Find all clients with pagination and filters
   */
  async findAll(query: QueryClientsDto) {
    const { search, kycStatus, riskRating, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { clientCode: { contains: search, mode: 'insensitive' } },
        { phonePrimary: { contains: search } },
        { idNumber: { contains: search } },
      ];
    }

    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    if (riskRating) {
      where.riskRating = riskRating;
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              loans: true,
              applications: true,
            },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one client by ID
   */
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        nextOfKin: true,
        referees: true,
        documents: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
        },
        kycEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            loans: true,
            applications: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Update client
   */
  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.findOne(id);

    // Check for ID number conflict if being updated
    if (updateClientDto.idNumber && updateClientDto.idNumber !== client.idNumber) {
      const existingId = await this.prisma.client.findUnique({
        where: { idNumber: updateClientDto.idNumber },
      });

      if (existingId) {
        throw new ConflictException('ID number already registered');
      }
    }

    // Check for phone conflict if being updated
    if (updateClientDto.phonePrimary && updateClientDto.phonePrimary !== client.phonePrimary) {
      const existingPhone = await this.prisma.client.findFirst({
        where: { phonePrimary: updateClientDto.phonePrimary },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        ...updateClientDto,
        dateOfBirth: updateClientDto.dateOfBirth
          ? new Date(updateClientDto.dateOfBirth)
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  async setProfileEditsAfterKyc(
    id: string,
    userId: string,
    dto: SetProfileEditsAfterKycDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const client = await this.findOne(id);

    if (client.kycStatus !== 'VERIFIED') {
      throw new BadRequestException(
        `Cannot change profile edit lock when status is: ${client.kycStatus}`,
      );
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        allowProfileEditsAfterKyc: dto.allowProfileEditsAfterKyc,
      },
      include: {
        user: true,
        kycEvents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return updated;
  }

  /**
   * Soft delete client
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Client deleted successfully' };
  }

  // ============================================
  // KYC WORKFLOW METHODS
  // ============================================

  /**
   * Submit client for KYC review
   */
  async submitForKyc(id: string, userId: string, dto: SubmitKycDto) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const client = await this.findOne(id);

    if (client.kycStatus !== 'UNVERIFIED') {
      throw new BadRequestException(
        `Cannot submit client with status: ${client.kycStatus}`,
      );
    }

    // Create KYC event
    await this.prisma.clientKycEvent.create({
      data: {
        clientId: id,
        fromStatus: 'UNVERIFIED',
        toStatus: 'PENDING_REVIEW',
        notes: dto.notes,
        performedBy: userId,
      },
    });

    // Update client status
    const updated = await this.prisma.client.update({
      where: { id },
      data: { kycStatus: 'PENDING_REVIEW' },
      include: {
        user: true,
        kycEvents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return updated;
  }

  /**
   * Approve client KYC
   */
  async approveKyc(id: string, userId: string, dto: ApproveKycDto) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const client = await this.findOne(id);

    if (client.kycStatus !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        `Cannot approve client with status: ${client.kycStatus}`,
      );
    }

    // Create KYC event
    await this.prisma.clientKycEvent.create({
      data: {
        clientId: id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'VERIFIED',
        notes: dto.notes,
        performedBy: userId,
      },
    });

    // Update client status
    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        kycVerifiedBy: userId,
        allowProfileEditsAfterKyc: false,
      },
      include: {
        user: true,
        kycEvents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return updated;
  }

  /**
   * Reject client KYC
   */
  async rejectKyc(id: string, userId: string, dto: RejectKycDto) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const client = await this.findOne(id);

    if (client.kycStatus !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        `Cannot reject client with status: ${client.kycStatus}`,
      );
    }

    // Create KYC event
    await this.prisma.clientKycEvent.create({
      data: {
        clientId: id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'REJECTED',
        reason: dto.reason,
        notes: dto.notes,
        performedBy: userId,
      },
    });

    // Update client status
    const updated = await this.prisma.client.update({
      where: { id },
      data: { kycStatus: 'REJECTED' },
      include: {
        user: true,
        kycEvents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return updated;
  }

  /**
   * Get KYC history for a client
   */
  async getKycHistory(id: string) {
    await this.findOne(id);

    const events = await this.prisma.clientKycEvent.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    return events;
  }

  /**
   * Update client risk rating
   */
  async updateRiskRating(id: string, userId: string, dto: UpdateRiskRatingDto) {
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const client = await this.findOne(id);

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        riskRating: dto.riskRating as any,
        notes: dto.notes ? `${dto.notes}\n---\nRisk rating updated` : undefined,
      },
    });

    return updated;
  }

  // ============================================
  // NEXT OF KIN METHODS
  // ============================================

  async addNextOfKin(clientId: string, dto: CreateNextOfKinDto) {
    await this.findOne(clientId);

    const nok = await this.prisma.clientNextOfKin.create({
      data: {
        clientId,
        ...dto,
      },
    });

    return nok;
  }

  async updateNextOfKin(clientId: string, nokId: string, dto: UpdateNextOfKinDto) {
    const nok = await this.prisma.clientNextOfKin.findFirst({
      where: { id: nokId, clientId },
    });

    if (!nok) {
      throw new NotFoundException('Next of kin not found');
    }

    const updated = await this.prisma.clientNextOfKin.update({
      where: { id: nokId },
      data: dto,
    });

    return updated;
  }

  async removeNextOfKin(clientId: string, nokId: string) {
    const nok = await this.prisma.clientNextOfKin.findFirst({
      where: { id: nokId, clientId },
    });

    if (!nok) {
      throw new NotFoundException('Next of kin not found');
    }

    await this.prisma.clientNextOfKin.delete({
      where: { id: nokId },
    });

    return { message: 'Next of kin removed successfully' };
  }

  // ============================================
  // REFEREE METHODS
  // ============================================

  async addReferee(clientId: string, dto: CreateRefereeDto) {
    await this.findOne(clientId);

    const referee = await this.prisma.clientReferee.create({
      data: {
        clientId,
        ...dto,
      },
    });

    return referee;
  }

  async updateReferee(clientId: string, refereeId: string, dto: UpdateRefereeDto) {
    const referee = await this.prisma.clientReferee.findFirst({
      where: { id: refereeId, clientId },
    });

    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    const updated = await this.prisma.clientReferee.update({
      where: { id: refereeId },
      data: dto,
    });

    return updated;
  }

  async removeReferee(clientId: string, refereeId: string) {
    const referee = await this.prisma.clientReferee.findFirst({
      where: { id: refereeId, clientId },
    });

    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    await this.prisma.clientReferee.delete({
      where: { id: refereeId },
    });

    return { message: 'Referee removed successfully' };
  }

  /**
   * Upload a document for a client
   */
  async uploadDocument(
    clientId: string,
    file: Express.Multer.File,
    documentType: string,
    uploadedBy: string,
  ) {
    // Verify client exists
    await this.findOne(clientId);

    const normalized = (documentType || '').toString().trim().toUpperCase();
    if (!Object.values(DocumentType).includes(normalized as any)) {
      throw new BadRequestException('Invalid document type');
    }

    const document = await this.prisma.clientDocument.create({
      data: {
        clientId,
        documentType: normalized as any,
        category: null,
        fileName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy,
        virusScanStatus: 'pending',
        reviewStatus: 'PENDING' as any,
        reviewNotes: null,
        reviewedAt: null,
        reviewedBy: null,
      },
    });

    return document;
  }

  /**
   * Get all documents for a client
   */
  async getDocuments(clientId: string) {
    await this.findOne(clientId);

    return this.prisma.clientDocument.findMany({
      where: {
        clientId,
        isDeleted: false,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(clientId: string, documentId: string) {
    const document = await this.prisma.clientDocument.findFirst({
      where: {
        id: documentId,
        clientId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.clientDocument.update({
      where: { id: documentId },
      data: { isDeleted: true },
    });

    return { message: 'Document deleted successfully' };
  }

  /**
   * Get client activity timeline
   */
  async getActivityTimeline(clientId: string) {
    await this.findOne(clientId);

    const kycEvents = await this.prisma.clientKycEvent.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const documents = await this.prisma.clientDocument.findMany({
      where: { clientId, isDeleted: false },
      orderBy: { uploadedAt: 'desc' },
      take: 20,
    });

    // Combine and sort by date
    const timeline = [
      ...kycEvents.map((event) => ({
        type: 'kyc_event',
        date: event.createdAt,
        data: event,
      })),
      ...documents.map((doc) => ({
        type: 'document',
        date: doc.uploadedAt,
        data: doc,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return timeline;
  }
}
