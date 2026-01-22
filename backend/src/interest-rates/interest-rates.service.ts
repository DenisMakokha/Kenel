import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterestRateDto, UpdateInterestRateDto, QueryInterestRatesDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InterestRatesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInterestRateDto) {
    return this.prisma.interestRate.create({
      data: {
        name: dto.name,
        type: dto.type,
        rate: dto.rate,
        ratePeriod: dto.ratePeriod,
        minTerm: dto.minTerm,
        maxTerm: dto.maxTerm,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async findAll(query: QueryInterestRatesDto) {
    const { page = 1, limit = 20, isActive, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InterestRateWhereInput = {
      deletedAt: null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.interestRate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.interestRate.count({ where }),
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
    const rate = await this.prisma.interestRate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!rate) {
      throw new NotFoundException('Interest rate not found');
    }

    return rate;
  }

  async update(id: string, dto: UpdateInterestRateDto) {
    await this.findOne(id);

    return this.prisma.interestRate.update({
      where: { id },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });
  }

  async toggleActive(id: string) {
    const rate = await this.findOne(id);
    return this.prisma.interestRate.update({
      where: { id },
      data: { isActive: !rate.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.interestRate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
