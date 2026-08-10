import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePayrollReviewFindingDto {
  @IsIn(['INFORMATIONAL', 'BLOCKING'])
  severity!: 'INFORMATIONAL' | 'BLOCKING';

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsUUID()
  employmentContractId?: string;

  @IsOptional()
  @IsUUID()
  payrollCalculationItemId?: string;
}

export class TransitionPayrollReviewFindingDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(1000)
  reason!: string;
}

export class PayrollReviewDecisionDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(1000)
  reason?: string;
}

export class ReopenPayrollReviewDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(1000)
  reason!: string;
}

export class PayrollReviewCycleMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) payrollRunId!: string;
  @ApiProperty({ enum: ['OPEN', 'IN_REVIEW', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CLOSED'] })
  status!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty() submissionNumber!: number;
  @ApiProperty() currentApprovalStage!: number;
  @ApiProperty() reviewRound!: number;
}

export class PayrollReviewFindingMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) reviewCycleId!: string;
  @ApiProperty({ format: 'uuid' }) payrollRunId!: string;
  @ApiProperty({ enum: ['INFORMATIONAL', 'BLOCKING'] }) severity!: string;
  @ApiProperty({ enum: ['OPEN', 'RESOLVED'] }) status!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) resolvedAt!: string | null;
}

export class PayrollReviewEventStateMinimalResponseDto {
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() severity?: string;
  @ApiPropertyOptional() blocking?: boolean;
  @ApiPropertyOptional() validApprovals?: number;
}

export class PayrollReviewEventMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ format: 'uuid' }) findingId?: string;
  @ApiProperty() eventType!: string;
  @ApiPropertyOptional({ type: PayrollReviewEventStateMinimalResponseDto, nullable: true })
  previousState!: PayrollReviewEventStateMinimalResponseDto | null;
  @ApiProperty({ type: PayrollReviewEventStateMinimalResponseDto })
  nextState!: PayrollReviewEventStateMinimalResponseDto;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

export class PayrollReviewApprovalStageMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() sequence!: number;
  @ApiProperty() code!: string;
  @ApiProperty() requiredCapability!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class PayrollReviewDecisionMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) approvalStageId!: string;
  @ApiProperty() submissionNumber!: number;
  @ApiProperty() reviewRound!: number;
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] }) decision!: string;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

export class PayrollReviewInvalidationMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) decisionId!: string;
  @ApiProperty({ format: 'uuid' }) causedByEventId!: string;
  @ApiProperty() reviewRound!: number;
  @ApiProperty({ format: 'date-time' }) invalidatedAt!: string;
}

export class PayrollReviewDetailsMinimalResponseDto extends PayrollReviewCycleMinimalResponseDto {
  @ApiProperty({ type: [PayrollReviewFindingMinimalResponseDto] })
  findings!: PayrollReviewFindingMinimalResponseDto[];
  @ApiProperty({ type: [PayrollReviewEventMinimalResponseDto] })
  events!: PayrollReviewEventMinimalResponseDto[];
  @ApiPropertyOptional({ type: [PayrollReviewApprovalStageMinimalResponseDto] })
  approvalStages?: PayrollReviewApprovalStageMinimalResponseDto[];
  @ApiPropertyOptional({ type: [PayrollReviewDecisionMinimalResponseDto] })
  decisions?: PayrollReviewDecisionMinimalResponseDto[];
}

export class PayrollReviewHistoryMinimalResponseDto {
  @ApiProperty() currentState!: string;
  @ApiProperty({ type: [PayrollReviewEventMinimalResponseDto] })
  timeline!: PayrollReviewEventMinimalResponseDto[];
  @ApiProperty({ type: [PayrollReviewFindingMinimalResponseDto] })
  findings!: PayrollReviewFindingMinimalResponseDto[];
  @ApiProperty({ type: [PayrollReviewApprovalStageMinimalResponseDto] })
  approvalStages!: PayrollReviewApprovalStageMinimalResponseDto[];
  @ApiProperty({ type: [PayrollReviewDecisionMinimalResponseDto] })
  decisions!: PayrollReviewDecisionMinimalResponseDto[];
  @ApiProperty({ type: [PayrollReviewInvalidationMinimalResponseDto] })
  invalidations!: PayrollReviewInvalidationMinimalResponseDto[];
}
