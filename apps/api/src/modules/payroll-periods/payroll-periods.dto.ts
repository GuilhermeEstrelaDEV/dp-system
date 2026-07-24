import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

export class PayrollPeriodQueryDto {
  @IsUUID() companyId!: string;
  @IsOptional() @IsIn(['OPEN', 'CLOSED', 'VALIDATING']) status?: string;
  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
  @IsOptional() @IsIn(['referenceDate', 'createdAt', 'status']) sortBy:
    'referenceDate' | 'createdAt' | 'status' = 'referenceDate';
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection: 'asc' | 'desc' = 'desc';
}

export class CreatePayrollPeriodDto {
  @ApiProperty() @IsUUID() companyId!: string;
  @ApiProperty() @IsUUID() payrollCalendarId!: string;
  @ApiProperty() @IsDateString() referenceDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) type?: string;
}

export class UpdatePayrollPeriodDto {
  @IsOptional() @IsUUID() payrollCalendarId?: string;
  @IsOptional() @IsDateString() referenceDate?: string;
  @IsOptional() @IsString() @MaxLength(30) type?: string;
}

export class ReopenPayrollPeriodDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'reason must contain non-whitespace characters' })
  @MaxLength(1000)
  reason!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601({ strict: true })
  expectedConsistencyToken!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedClosureVersion!: number;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
