import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PayrollPeriodWarningAcknowledgementDto {
  @ApiProperty({ example: 'VARIABLE_PAY_PENDING' })
  @IsString()
  @MaxLength(100)
  warningCode!: string;

  @ApiProperty({ enum: [true] })
  @Equals(true)
  acknowledged!: true;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ClosePayrollPeriodCommandDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  payrollRunId!: string;

  @ApiProperty({ format: 'date-time', description: 'Token returned by closure-readiness.' })
  @IsISO8601({ strict: true })
  expectedConsistencyToken!: string;

  @ApiProperty({ type: [PayrollPeriodWarningAcknowledgementDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PayrollPeriodWarningAcknowledgementDto)
  warningAcknowledgements!: PayrollPeriodWarningAcknowledgementDto[];

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedClosureVersion?: number;
}

export class ClosePayrollPeriodResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty({ format: 'uuid' }) closureId!: string;
  @ApiProperty() closureVersion!: number;
  @ApiProperty({ enum: ['CLOSED'] }) status!: 'CLOSED';
  @ApiProperty({ format: 'uuid' }) payrollRunId!: string;
  @ApiProperty({ format: 'uuid' }) reviewCycleId!: string;
  @ApiProperty() reviewRound!: number;
  @ApiProperty({ format: 'uuid' }) manifestId!: string;
  @ApiProperty() manifestHash!: string;
  @ApiProperty({ example: 'sha256-canonical-json-v1' }) hashAlgorithmVersion!: string;
  @ApiProperty({ type: [String] }) warningsAcknowledged!: string[];
  @ApiProperty({ format: 'date-time' }) closedAt!: string;
  @ApiProperty({ format: 'uuid' }) closedBy!: string;
  @ApiProperty({ format: 'date-time' }) consistencyToken!: string;
  @ApiProperty() traceId!: string;
  @ApiProperty() idempotentReplay!: boolean;
}
