import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayrollPeriodClosureEventMinimalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() type!: string;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

export class PayrollPeriodWarningAcknowledgementMinimalDto {
  @ApiProperty() warningCode!: string;
  @ApiProperty({ format: 'date-time' }) acknowledgedAt!: string;
  @ApiPropertyOptional() acknowledged?: boolean;
}

export class PayrollPeriodRunReferenceMinimalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() sequence!: number;
  @ApiProperty() status!: string;
}

export class PayrollPeriodReviewReferenceMinimalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() reviewRound!: number;
  @ApiProperty() status!: string;
}

export class PayrollPeriodVersionReferenceMinimalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() version!: number;
}

export class PayrollPeriodManifestEvidenceMinimalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() version!: number;
  @ApiProperty() hash!: string;
  @ApiProperty() algorithm!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class PayrollPeriodManifestSummaryMinimalDto {
  @ApiProperty({ nullable: true }) previousStatus!: string | null;
  @ApiProperty({ nullable: true }) intendedStatus!: string | null;
  @ApiProperty({ format: 'date-time', nullable: true }) generatedAt!: string | null;
  @ApiProperty({ nullable: true }) payrollRunSequence!: number | null;
  @ApiProperty({ nullable: true }) reviewRound!: number | null;
}

export class PayrollPeriodManifestReferencesMinimalDto {
  @ApiProperty({ format: 'uuid', nullable: true }) payrollRunId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) reviewCycleId!: string | null;
}

export class PayrollPeriodClosureVersionMinimalDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() version!: number;
  @ApiProperty() status!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ format: 'date-time' }) openedAt!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) closedAt!: string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) reopenedAt!: string | null;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) supersededAt!: string | null;
  @ApiPropertyOptional({ type: PayrollPeriodRunReferenceMinimalDto, nullable: true })
  payrollRun!: PayrollPeriodRunReferenceMinimalDto | null;
  @ApiPropertyOptional({ type: PayrollPeriodReviewReferenceMinimalDto, nullable: true })
  review!: PayrollPeriodReviewReferenceMinimalDto | null;
  @ApiPropertyOptional({ type: PayrollPeriodVersionReferenceMinimalDto, nullable: true })
  predecessor!: PayrollPeriodVersionReferenceMinimalDto | null;
  @ApiPropertyOptional({ type: PayrollPeriodVersionReferenceMinimalDto, nullable: true })
  successor!: PayrollPeriodVersionReferenceMinimalDto | null;
  @ApiPropertyOptional({ type: PayrollPeriodManifestEvidenceMinimalDto, nullable: true })
  manifest!: PayrollPeriodManifestEvidenceMinimalDto | null;
  @ApiProperty({ type: [PayrollPeriodClosureEventMinimalDto] })
  events!: PayrollPeriodClosureEventMinimalDto[];
  @ApiPropertyOptional({ type: [PayrollPeriodWarningAcknowledgementMinimalDto] })
  warningAcknowledgements?: PayrollPeriodWarningAcknowledgementMinimalDto[];
}

export class PayrollPeriodHistoryResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty({ type: [PayrollPeriodClosureVersionMinimalDto] })
  versions!: PayrollPeriodClosureVersionMinimalDto[];
}
export class PayrollPeriodHistoryEventsResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty() closureVersion!: number;
  @ApiProperty({ type: [PayrollPeriodClosureEventMinimalDto] })
  events!: PayrollPeriodClosureEventMinimalDto[];
}
export class PayrollPeriodManifestResponseDto {
  @ApiProperty({ format: 'uuid' }) payrollPeriodId!: string;
  @ApiProperty() closureVersion!: number;
  @ApiProperty({ format: 'uuid' }) manifestId!: string;
  @ApiProperty() manifestVersion!: number;
  @ApiProperty() hash!: string;
  @ApiProperty() algorithm!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty() schemaVersion!: string | null;
  @ApiProperty({ type: PayrollPeriodManifestSummaryMinimalDto })
  summary!: PayrollPeriodManifestSummaryMinimalDto;
  @ApiProperty({ type: [String] }) warnings!: string[];
  @ApiProperty({ type: [PayrollPeriodWarningAcknowledgementMinimalDto] })
  acknowledgements!: PayrollPeriodWarningAcknowledgementMinimalDto[];
  @ApiProperty({ type: PayrollPeriodManifestReferencesMinimalDto })
  references!: PayrollPeriodManifestReferencesMinimalDto;
}
