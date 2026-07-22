import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import {
  PAYROLL_PERIOD_READINESS_BLOCKER_CODES,
  PAYROLL_PERIOD_READINESS_WARNING_CODES,
  type PayrollPeriodReadinessBlocker,
  type PayrollPeriodReadinessWarning,
  type ReadinessMetadata,
} from './domain/payroll-period-closure-readiness';

export class PayrollPeriodClosureReadinessQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  payrollRunId?: string;
}

export class PayrollPeriodReadinessBlockerDto implements PayrollPeriodReadinessBlocker {
  @ApiProperty({ enum: PAYROLL_PERIOD_READINESS_BLOCKER_CODES })
  code!: PayrollPeriodReadinessBlocker['code'];

  @ApiProperty({ enum: ['PERIOD', 'RUN', 'REVIEW', 'CALCULATION', 'CONCURRENCY'] })
  category!: PayrollPeriodReadinessBlocker['category'];

  @ApiProperty()
  message!: string;

  @ApiProperty({ enum: ['BLOCKING'] })
  severity!: 'BLOCKING';

  @ApiProperty({ enum: ['PAYROLL_PERIOD', 'PAYROLL_RUN', 'PAYROLL_REVIEW'] })
  source!: PayrollPeriodReadinessBlocker['source'];

  @ApiPropertyOptional()
  relatedEntityType?: PayrollPeriodReadinessBlocker['relatedEntityType'];

  @ApiPropertyOptional({ format: 'uuid' })
  relatedEntityId?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata?: ReadinessMetadata;
}

export class PayrollPeriodReadinessWarningDto implements PayrollPeriodReadinessWarning {
  @ApiProperty({ enum: PAYROLL_PERIOD_READINESS_WARNING_CODES })
  code!: PayrollPeriodReadinessWarning['code'];

  @ApiProperty({ enum: ['VARIABLE_PAY', 'INTEGRATION', 'OPERATIONAL', 'AUXILIARY_DATA'] })
  category!: PayrollPeriodReadinessWarning['category'];

  @ApiProperty()
  message!: string;

  @ApiProperty()
  acknowledgementRequired!: boolean;

  @ApiProperty({ enum: ['VARIABLE_COMPENSATION', 'PAYROLL_RUN'] })
  source!: PayrollPeriodReadinessWarning['source'];

  @ApiPropertyOptional()
  relatedEntityType?: PayrollPeriodReadinessWarning['relatedEntityType'];

  @ApiPropertyOptional({ format: 'uuid' })
  relatedEntityId?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata?: ReadinessMetadata;
}

export class SelectedPayrollRunReadinessDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() sequence!: number;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() completedAt!: string | null;
  @ApiProperty() engineVersion!: string;
  @ApiPropertyOptional() parameterVersion!: string | null;
}

export class LinkedPayrollReviewCycleReadinessDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() status!: string;
  @ApiProperty() reviewRound!: number;
  @ApiProperty() submissionNumber!: number;
}

export class PayrollPeriodClosureReadinessResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty({ format: 'uuid' }) companyId!: string;
  @ApiProperty({ format: 'date' }) referenceDate!: string;
  @ApiProperty() currentStatus!: string;
  @ApiProperty() isReady!: boolean;
  @ApiProperty({ format: 'date-time' }) evaluatedAt!: string;
  @ApiPropertyOptional({ type: SelectedPayrollRunReadinessDto, nullable: true })
  selectedPayrollRun!: SelectedPayrollRunReadinessDto | null;
  @ApiPropertyOptional({ type: LinkedPayrollReviewCycleReadinessDto, nullable: true })
  linkedReviewCycle!: LinkedPayrollReviewCycleReadinessDto | null;
  @ApiProperty({ type: [PayrollPeriodReadinessBlockerDto] })
  blockers!: PayrollPeriodReadinessBlockerDto[];
  @ApiProperty({ type: [PayrollPeriodReadinessWarningDto] })
  warnings!: PayrollPeriodReadinessWarningDto[];
  @ApiProperty({ enum: PAYROLL_PERIOD_READINESS_WARNING_CODES, isArray: true })
  acknowledgementsRequired!: PayrollPeriodReadinessWarning['code'][];
  @ApiProperty({ description: 'Timestamp observado de PayrollPeriod.updatedAt.' })
  consistencyToken!: string;
  @ApiProperty() traceId!: string;
  @ApiProperty({ enum: ['EXTERNAL_INTEGRATIONS_PENDING'], isArray: true })
  unavailableWarningChecks!: PayrollPeriodReadinessWarning['code'][];
}
