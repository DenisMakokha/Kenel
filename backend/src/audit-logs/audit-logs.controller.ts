import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'List audit logs with optional filters for entity, entityId, or loanId' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  list(@Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.getLogs(query);
  }
}
