import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}
