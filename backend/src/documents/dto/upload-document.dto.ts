import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  type: string;

  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Target clientId (mutually exclusive with applicationId)' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Target applicationId (mutually exclusive with clientId)' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
