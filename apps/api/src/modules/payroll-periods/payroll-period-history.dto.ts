import { ApiProperty } from '@nestjs/swagger';

export class PayrollPeriodHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) versions!: object[];
}
export class PayrollPeriodHistoryEventsResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty() closureVersion!: number;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) events!: object[];
}
export class PayrollPeriodManifestResponseDto {
  @ApiProperty() closureVersion!: number;
  @ApiProperty() hash!: string;
  @ApiProperty() algorithm!: string;
  @ApiProperty() schemaVersion!: string | null;
}
