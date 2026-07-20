import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';
const decimal = /^-?\d+(\.\d{1,4})?$/;
export class PayrollInputQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() payrollPeriodId?: string;
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() employmentContractId?: string;
  @IsOptional() @IsUUID() payrollRubricId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
  @IsOptional() @IsIn(['createdAt', 'amount', 'status']) sortBy: 'createdAt' | 'amount' | 'status' =
    'createdAt';
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection: 'asc' | 'desc' = 'desc';
}
export class CreatePayrollInputDto {
  @IsUUID() payrollPeriodId!: string;
  @IsUUID() employeeId!: string;
  @IsUUID() employmentContractId!: string;
  @IsUUID() payrollRubricId!: string;
  @Matches(decimal) amount!: string;
  @IsOptional() @Matches(/^\d+(\.\d{1,4})?$/) quantity?: string;
  @IsOptional() @IsString() @MaxLength(160) sourceKey?: string;
  @IsOptional() @IsString() @MaxLength(30) sourceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) technicalNotes?: string;
}
export class UpdatePayrollInputDto {
  @IsOptional() @Matches(decimal) amount?: string;
  @IsOptional() @Matches(/^\d+(\.\d{1,4})?$/) quantity?: string;
  @IsOptional() @IsString() @MaxLength(1000) technicalNotes?: string;
  @IsOptional() @IsIn(['PENDING', 'INACTIVE']) status?: string;
}
