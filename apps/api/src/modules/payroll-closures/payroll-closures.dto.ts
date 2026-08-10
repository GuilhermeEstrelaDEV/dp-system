import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { ClosePayrollPeriodCommandDto } from '../payroll-periods/payroll-period-operational-closure.dto';
import { ControlledReopenPayrollPeriodDto } from '../payroll-periods/payroll-periods.dto';
import { PayrollPeriodClosureVersionMinimalDto } from '../payroll-periods/payroll-period-history.dto';

export class PayrollClosureQueryDto {
  @ApiProperty({ format: 'uuid', description: 'Canonical payroll period identifier.' })
  @IsUUID()
  payrollPeriodId!: string;

  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
}

export class ClosePayrollPeriodDto extends ClosePayrollPeriodCommandDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  payrollPeriodId!: string;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Legacy alias for the canonical note field; never an acknowledgement.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ReopenPayrollPeriodDto extends ControlledReopenPayrollPeriodDto {}

export class PayrollClosurePaginationDto {
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
}

export class PayrollClosurePageResponseDto {
  @ApiProperty({ type: [PayrollPeriodClosureVersionMinimalDto] })
  items!: PayrollPeriodClosureVersionMinimalDto[];

  @ApiProperty({ type: PayrollClosurePaginationDto })
  pagination!: PayrollClosurePaginationDto;
}
