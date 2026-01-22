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
import { InterestRatesService } from './interest-rates.service';
import { CreateInterestRateDto, UpdateInterestRateDto, QueryInterestRatesDto } from './dto';

@ApiTags('interest-rates')
@ApiBearerAuth()
@Controller('interest-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterestRatesController {
  constructor(private readonly interestRatesService: InterestRatesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Create a new interest rate' })
  @ApiResponse({ status: 201, description: 'Interest rate created successfully' })
  create(@Body() dto: CreateInterestRateDto) {
    return this.interestRatesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all interest rates' })
  @ApiResponse({ status: 200, description: 'Interest rates retrieved successfully' })
  findAll(@Query() query: QueryInterestRatesDto) {
    return this.interestRatesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER, UserRole.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get interest rate by ID' })
  @ApiResponse({ status: 200, description: 'Interest rate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Interest rate not found' })
  findOne(@Param('id') id: string) {
    return this.interestRatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Update interest rate' })
  @ApiResponse({ status: 200, description: 'Interest rate updated successfully' })
  @ApiResponse({ status: 404, description: 'Interest rate not found' })
  update(@Param('id') id: string, @Body() dto: UpdateInterestRateDto) {
    return this.interestRatesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)
  @ApiOperation({ summary: 'Toggle interest rate active status' })
  @ApiResponse({ status: 200, description: 'Status toggled successfully' })
  toggleActive(@Param('id') id: string) {
    return this.interestRatesService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete interest rate' })
  @ApiResponse({ status: 204, description: 'Interest rate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Interest rate not found' })
  remove(@Param('id') id: string) {
    return this.interestRatesService.remove(id);
  }
}
