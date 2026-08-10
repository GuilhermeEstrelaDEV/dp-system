import { ApiProperty } from '@nestjs/swagger';

export class ReopenPayrollPeriodResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty({ format: 'uuid' }) previousClosureId!: string;
  @ApiProperty() previousClosureVersion!: number;
  @ApiProperty({ format: 'uuid' }) newClosureId!: string;
  @ApiProperty() newClosureVersion!: number;
  @ApiProperty({ enum: ['OPEN'] }) status!: 'OPEN';
  @ApiProperty({ format: 'uuid' }) previousManifestId!: string;
  @ApiProperty() previousManifestHash!: string;
  @ApiProperty({ format: 'date-time' }) reopenedAt!: string;
  @ApiProperty({ format: 'date-time' }) consistencyToken!: string;
  @ApiProperty({ enum: [true] }) requiresNewPayrollRun!: true;
  @ApiProperty({ enum: [true] }) requiresNewPayrollReview!: true;
  @ApiProperty() idempotentReplay!: boolean;
}
