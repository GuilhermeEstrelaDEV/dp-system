import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ListQueryDto } from '../organizational/common.dto';
export class AdmissionProcessListQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() contractId?: string;
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
