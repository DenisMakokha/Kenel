import { IsIn, IsOptional, IsString } from 'class-validator';

export class VerifyDocumentDto {
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}
