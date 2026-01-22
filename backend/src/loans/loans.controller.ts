import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LoanStatus, UserRole } from '@prisma/client';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'List loans with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Loans retrieved successfully' })
  findAll(
    @Query('status') status?: LoanStatus,
    @Query('clientId') clientId?: string,
    @Query('applicationId') applicationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loansService.findAll({
      status,
      clientId,
      applicationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get loan detail by ID' })
  @ApiResponse({ status: 200, description: 'Loan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post('from-application/:applicationId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Create a loan from an approved application' })
  @ApiResponse({ status: 201, description: 'Loan created successfully' })
  @ApiResponse({ status: 400, description: 'Application not approved or already has a loan' })
  createFromApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    return this.loansService.createFromApplication(applicationId, user.sub);
  }

  @Post(':id/disburse')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Disburse a loan (PENDING_DISBURSEMENT → ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Loan disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Only PENDING_DISBURSEMENT loans can be disbursed' })
  disburse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.loansService.disburse(id, user.sub);
  }
}
