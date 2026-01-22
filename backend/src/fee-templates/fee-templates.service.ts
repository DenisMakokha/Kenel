import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeTemplateDto, UpdateFeeTemplateDto, QueryFeeTemplatesDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FeeTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeeTemplateDto) {
    return this.prisma.feeTemplate.create({
      data: {
        name: dto.name,
        category: dto.category,
        calculationType: dto.calculationType,
        value: dto.value,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        description: dto.description,
      },
    });
  }

  async findAll(query: QueryFeeTemplatesDto) {
    const { page = 1, limit = 20, isActive, category } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FeeTemplateWhereInput = {
      deletedAt: null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (category) {
      where.category = category;
    }

    const [data, total] = await Promise.all([
      this.prisma.feeTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feeTemplate.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const fee = await this.prisma.feeTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!fee) {
      throw new NotFoundException('Fee template not found');
    }

    return fee;
  }

  async update(id: string, dto: UpdateFeeTemplateDto) {
    await this.findOne(id);

    return this.prisma.feeTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string) {
    const fee = await this.findOne(id);
    return this.prisma.feeTemplate.update({
      where: { id },
      data: { isActive: !fee.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feeTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
