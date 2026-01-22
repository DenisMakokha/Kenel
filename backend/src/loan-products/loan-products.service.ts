import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLoanProductDto,
  UpdateLoanProductDto,
  CreateProductVersionDto,
  UpdateProductVersionDto,
  QueryProductsDto,
  QueryVersionsDto,
  PreviewScheduleDto,
  ProductVersionStatus,
} from './dto';
import { RulesValidator } from './validators/rules.validator';
import { LoanProductRules } from './interfaces/loan-product-rules.interface';

@Injectable()
export class LoanProductsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PRODUCT CRUD
  // ============================================

  /**
   * Create a new loan product
   */
  async createProduct(dto: CreateLoanProductDto, userId: string) {
    // Check if code already exists
    const existing = await this.prisma.loanProduct.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Product with code '${dto.code}' already exists`);
    }

    const product = await this.prisma.loanProduct.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        currencyCode: dto.currencyCode || 'KES',
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    // Log audit
    await this.logAudit(product.id, null, 'create_product', userId, {
      product: dto,
    });

    return product;
  }

  /**
   * Get all products with filtering and pagination
   */
  async getProducts(query: QueryProductsDto) {
    const { productType, isActive, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (productType) {
      where.productType = productType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.loanProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          versions: {
            where: { status: 'PUBLISHED' },
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.loanProduct.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string) {
    const product = await this.prisma.loanProduct.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Update product metadata (not rules)
   */
  async updateProduct(id: string, dto: UpdateLoanProductDto, userId: string) {
    const product = await this.prisma.loanProduct.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.prisma.loanProduct.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        productType: dto.productType,
        currencyCode: dto.currencyCode,
        isActive: dto.isActive,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
      },
    });

    // Log audit
    await this.logAudit(id, null, 'update_product', userId, {
      old: product,
      new: updated,
    });

    return updated;
  }

  /**
   * Soft delete product
   */
  async deleteProduct(id: string, userId: string) {
    const product = await this.prisma.loanProduct.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if any published versions exist with active loans
    // TODO: Add check for active loans when loan module is complete

    await this.prisma.loanProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await this.logAudit(id, null, 'delete_product', userId, {
      product,
    });

    return { message: 'Product deleted successfully' };
  }

  // ============================================
  // VERSION MANAGEMENT
  // ============================================

  /**
   * Get all versions for a product
   */
  async getVersions(productId: string, query: QueryVersionsDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    await this.getProduct(productId); // Verify product exists

    const where: any = { loanProductId: productId };
    if (status) {
      where.status = status;
    }

    const [versions, total] = await Promise.all([
      this.prisma.loanProductVersion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { versionNumber: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.loanProductVersion.count({ where }),
    ]);

    return {
      data: versions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single version
   */
  async getVersion(productId: string, versionId: string) {
    const version = await this.prisma.loanProductVersion.findFirst({
      where: {
        id: versionId,
        loanProductId: productId,
      },
      include: {
        loanProduct: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }

  /**
   * Create new version (draft)
   */
  async createVersion(productId: string, dto: CreateProductVersionDto, userId: string) {
    await this.getProduct(productId); // Verify product exists

    // Validate rules
    RulesValidator.validateAndThrow(dto.rules);

    // Get next version number if not provided
    let versionNumber = dto.versionNumber;
    if (!versionNumber) {
      const lastVersion = await this.prisma.loanProductVersion.findFirst({
        where: { loanProductId: productId },
        orderBy: { versionNumber: 'desc' },
      });
      versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
    }

    // Check if version number already exists
    const existing = await this.prisma.loanProductVersion.findUnique({
      where: {
        loanProductId_versionNumber: {
          loanProductId: productId,
          versionNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Version ${versionNumber} already exists`);
    }

    const version = await this.prisma.loanProductVersion.create({
      data: {
        loanProductId: productId,
        versionNumber,
        status: 'DRAFT',
        rules: dto.rules as any,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo,
        createdByUserId: userId,
      },
      include: {
        loanProduct: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit(productId, version.id, 'create_version', userId, {
      version: dto,
    });

    return version;
  }

  /**
   * Update version (only if DRAFT)
   */
  async updateVersion(
    productId: string,
    versionId: string,
    dto: UpdateProductVersionDto,
    userId: string,
  ) {
    const version = await this.getVersion(productId, versionId);

    if (version.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT versions can be updated');
    }

    // Validate rules if provided
    if (dto.rules) {
      RulesValidator.validateAndThrow(dto.rules);
    }

    const updated = await this.prisma.loanProductVersion.update({
      where: { id: versionId },
      data: {
        rules: dto.rules as any,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo,
      },
      include: {
        loanProduct: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit(productId, versionId, 'update_draft', userId, {
      old: version,
      new: updated,
    });

    return updated;
  }

  /**
   * Publish version
   */
  async publishVersion(productId: string, versionId: string, userId: string) {
    const version = await this.getVersion(productId, versionId);

    if (version.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT versions can be published');
    }

    // Validate rules one more time
    RulesValidator.validateAndThrow(version.rules as unknown as LoanProductRules);

    // Optionally retire previous published versions
    await this.prisma.loanProductVersion.updateMany({
      where: {
        loanProductId: productId,
        status: 'PUBLISHED',
      },
      data: {
        status: 'RETIRED',
        effectiveTo: new Date(),
      },
    });

    const published = await this.prisma.loanProductVersion.update({
      where: { id: versionId },
      data: {
        status: 'PUBLISHED',
        effectiveFrom: version.effectiveFrom || new Date(),
      },
      include: {
        loanProduct: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log audit
    await this.logAudit(productId, versionId, 'publish', userId, {
      version: published,
    });

    return published;
  }

  /**
   * Retire version
   */
  async retireVersion(productId: string, versionId: string, userId: string) {
    const version = await this.getVersion(productId, versionId);

    if (version.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED versions can be retired');
    }

    // TODO: Check if any active loans use this version

    const retired = await this.prisma.loanProductVersion.update({
      where: { id: versionId },
      data: {
        status: 'RETIRED',
        effectiveTo: new Date(),
      },
      include: {
        loanProduct: true,
      },
    });

    // Log audit
    await this.logAudit(productId, versionId, 'retire', userId, {
      version: retired,
    });

    return retired;
  }

  // ============================================
  // SCHEDULE PREVIEW
  // ============================================

  /**
   * Preview loan schedule based on version rules
   */
  async previewSchedule(productId: string, versionId: string, dto: PreviewScheduleDto) {
    const version = await this.getVersion(productId, versionId);
    const rules = version.rules as unknown as LoanProductRules;

    // Validate inputs against rules
    if (dto.principal < rules.terms.min_principal || dto.principal > rules.terms.max_principal) {
      throw new BadRequestException(
        `Principal must be between ${rules.terms.min_principal} and ${rules.terms.max_principal}`,
      );
    }

    if (dto.term_months < rules.terms.min_term_months || dto.term_months > rules.terms.max_term_months) {
      throw new BadRequestException(
        `Term must be between ${rules.terms.min_term_months} and ${rules.terms.max_term_months} months`,
      );
    }

    // Calculate schedule
    const schedule = this.calculateSchedule(dto.principal, dto.term_months, dto.start_date, rules);

    return {
      currency: version.loanProduct.currencyCode,
      productName: version.loanProduct.name,
      versionNumber: version.versionNumber,
      ...schedule,
    };
  }

  /**
   * Calculate loan schedule (simplified - will be enhanced with schedule engine)
   */
  private calculateSchedule(
    principal: number,
    termMonths: number,
    startDate: string,
    rules: LoanProductRules,
  ) {
    const installments = [];
    const interestRate = rules.interest.rate_per_year / 100 / 12; // Monthly rate
    const processingFee = this.calculateProcessingFee(principal, rules.fees);

    let balance = principal;
    const monthlyPayment =
      rules.interest.calculation_method === 'FLAT'
        ? this.calculateFlatPayment(principal, termMonths, rules.interest.rate_per_year)
        : this.calculateDecliningPayment(principal, termMonths, interestRate);

    for (let i = 1; i <= termMonths; i++) {
      const dueDate = this.addMonths(new Date(startDate), i);
      const interest =
        rules.interest.calculation_method === 'FLAT'
          ? (principal * rules.interest.rate_per_year) / 100 / 12
          : balance * interestRate;

      const principalPayment = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPayment);

      installments.push({
        number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        fees: i === 1 ? processingFee : 0,
        total_due: Math.round((monthlyPayment + (i === 1 ? processingFee : 0)) * 100) / 100,
        balance_after: Math.round(balance * 100) / 100,
      });
    }

    const totalPrincipal = principal;
    const totalInterest = installments.reduce((sum, inst) => sum + inst.interest, 0);
    const totalFees = processingFee;

    return {
      installments,
      totals: {
        principal: totalPrincipal,
        interest: Math.round(totalInterest * 100) / 100,
        fees: totalFees,
        total_payable: Math.round((totalPrincipal + totalInterest + totalFees) * 100) / 100,
      },
    };
  }

  private calculateProcessingFee(principal: number, fees: any): number {
    if (fees.processing_fee_type === 'PERCENTAGE') {
      const fee = (principal * fees.processing_fee_value) / 100;
      return fees.processing_fee_cap ? Math.min(fee, fees.processing_fee_cap) : fee;
    }
    return fees.processing_fee_value;
  }

  private calculateFlatPayment(principal: number, termMonths: number, annualRate: number): number {
    const totalInterest = (principal * annualRate * termMonths) / 100 / 12;
    return (principal + totalInterest) / termMonths;
  }

  private calculateDecliningPayment(principal: number, termMonths: number, monthlyRate: number): number {
    if (monthlyRate === 0) return principal / termMonths;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  /**
   * Get audit logs for a product
   */
  async getAuditLogs(productId: string, page = 1, limit = 50) {
    await this.getProduct(productId); // Verify product exists

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.loanProductAuditLog.findMany({
        where: { loanProductId: productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          productVersion: {
            select: {
              id: true,
              versionNumber: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.loanProductAuditLog.count({ where: { loanProductId: productId } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Log audit entry
   */
  private async logAudit(
    productId: string,
    versionId: string | null,
    action: string,
    userId: string,
    payload: any,
  ) {
    await this.prisma.loanProductAuditLog.create({
      data: {
        loanProductId: productId,
        productVersionId: versionId,
        action,
        performedBy: userId,
        payloadSnapshot: payload,
      },
    });
  }
}
