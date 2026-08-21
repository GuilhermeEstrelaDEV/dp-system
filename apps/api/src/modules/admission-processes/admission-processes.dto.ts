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
export class AdmissionProcessListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() contractId?: string;
  @IsOptional()
  @IsIn(['DRAFT', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'CANCELLED'])
  status?: 'DRAFT' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
}
export class CreateAdmissionProcessDto {
  @IsUUID() employeeId!: string;
  @IsUUID() employmentContractId!: string;
  @IsOptional() @IsUUID() checklistTemplateId?: string;
  @IsDateString() plannedAdmissionDate!: string;
  @IsOptional() @IsString() @MaxLength(160) operationalOwner?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
export class UpdateAdmissionProcessDto {
  @IsOptional() @IsDateString() plannedAdmissionDate?: string;
  @IsOptional() @IsDateString() effectiveAdmissionDate?: string;
  @IsOptional() @IsString() @MaxLength(160) operationalOwner?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
export class ReasonDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}
