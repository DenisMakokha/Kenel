import { ApiProperty } from '@nestjs/swagger';

export class BulkActionResultDto {
  @ApiProperty({ example: 10 })
  requested!: number;

  @ApiProperty({ example: 8 })
  succeeded!: number;

  @ApiProperty({ example: 2 })
  failed!: number;

  @ApiProperty({ type: [String], description: 'IDs processed successfully' })
  succeededIds!: string[];

  @ApiProperty({
    type: [Object],
    description: 'Errors (id + message) for failed items',
    example: [{ id: 'uuid', message: 'Only UNDER_REVIEW applications can be approved' }],
  })
  errors!: Array<{ id: string; message: string }>;
}
