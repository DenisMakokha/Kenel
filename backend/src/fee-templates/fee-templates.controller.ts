import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FeeTemplatesService } from './fee-templates.service';
import { CreateFeeTemplateDto, UpdateFeeTemplateDto, QueryFeeTemplatesDto } from './dto';

@ApiTags('fee-templates')
@ApiBearerAuth()
@Controller('fee-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeTemplatesController {
  constructor(private readonly feeTemplatesService: FeeTemplatesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Create a new fee template' })
  @ApiResponse({ status: 201, description: 'Fee template created successfully' })
  create(@Body() dto: CreateFeeTemplateDto) {
    return this.feeTemplatesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all fee templates' })
  @ApiResponse({ status: 200, description: 'Fee templates retrieved successfully' })
  findAll(@Query() query: QueryFeeTemplatesDto) {
    return this.feeTemplatesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get fee template by ID' })
  @ApiResponse({ status: 200, description: 'Fee template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Fee template not found' })
  findOne(@Param('id') id: string) {
    return this.feeTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update fee template' })
  @ApiResponse({ status: 200, description: 'Fee template updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee template not found' })
  update(@Param('id') id: string, @Body() dto: UpdateFeeTemplateDto) {
    return this.feeTemplatesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Toggle fee template active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleActive(@Param('id') id: string) {
    return this.feeTemplatesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete fee template' })
  @ApiResponse({ status: 204, description: 'Fee template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fee template not found' })
  remove(@Param('id') id: string) {
    return this.feeTemplatesService.remove(id);
  }
}
