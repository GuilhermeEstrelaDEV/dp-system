import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardMetricMinimalDto {
  @ApiProperty() value!: number;
  @ApiProperty() label!: string;
  @ApiProperty({ description: 'Static presentation text; never sourced from domain content.' })
  description!: string;
}

export class DashboardDataPointMinimalDto {
  @ApiProperty() key!: string;
  @ApiProperty() label!: string;
  @ApiProperty() value!: number;
}

export class DashboardActivityMinimalDto {
  @ApiProperty() type!: string;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

export class DashboardReviewMinimalDto {
  @ApiProperty({ type: [DashboardMetricMinimalDto] }) metrics!: DashboardMetricMinimalDto[];
  @ApiProperty({ type: [DashboardDataPointMinimalDto] })
  statusDistribution!: DashboardDataPointMinimalDto[];
  @ApiProperty({ type: [DashboardDataPointMinimalDto] })
  sixMonthTimeline!: DashboardDataPointMinimalDto[];
  @ApiProperty({ type: [DashboardActivityMinimalDto] })
  recentActivity!: DashboardActivityMinimalDto[];
}

export class DashboardContextMinimalDto {
  @ApiProperty({ format: 'uuid' }) companyId!: string;
  @ApiProperty() companyName!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ enum: ['UTC'] }) timezone!: 'UTC';
}

export class DashboardSummaryMinimalDto {
  @ApiProperty({ type: DashboardContextMinimalDto }) context!: DashboardContextMinimalDto;
  @ApiProperty({ enum: ['AVAILABLE', 'RESTRICTED'] })
  access!: 'AVAILABLE' | 'RESTRICTED';
  @ApiPropertyOptional({ type: DashboardReviewMinimalDto }) review?: DashboardReviewMinimalDto;
  @ApiPropertyOptional({
    type: 'object',
    properties: {
      metrics: { type: 'array', items: { $ref: '#/components/schemas/DashboardMetricMinimalDto' } },
      statusDistribution: {
        type: 'array',
        items: { $ref: '#/components/schemas/DashboardDataPointMinimalDto' },
      },
    },
  })
  payrollPeriod?: {
    metrics: DashboardMetricMinimalDto[];
    statusDistribution: DashboardDataPointMinimalDto[];
  };
}
