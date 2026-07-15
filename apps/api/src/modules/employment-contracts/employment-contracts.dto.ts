import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ListQueryDto } from '../organizational/common.dto';

export class EmploymentContractListQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsIn(['startDate', 'createdAt', 'registrationNumber']) declare sortBy: string;
}

export class CreateEmploymentContractDto {
  @IsUUID() employeeId!: string;
  @IsUUID() companyId!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsUUID() positionId!: string;
  @IsOptional() @IsUUID() costCenterId?: string;
  @IsString() @IsNotEmpty() @MaxLength(50) registrationNumber!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) contractType!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) employmentRegime!: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(168) weeklyHours!: number;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class UpdateEmploymentContractDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() branchId?: string | null;
  @IsOptional() @IsUUID() departmentId?: string | null;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsUUID() costCenterId?: string | null;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) registrationNumber?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) contractType?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) employmentRegime?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(168) weeklyHours?: number;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class ContractStatusDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
