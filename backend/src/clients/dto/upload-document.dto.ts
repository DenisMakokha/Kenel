import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType, description: 'Type of document being uploaded' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ required: false, description: 'Additional notes about the document' })
  @IsOptional()
  @IsString()
  notes?: string;
}
