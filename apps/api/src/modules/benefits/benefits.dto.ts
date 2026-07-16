import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateBenefitDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsIn(['TRANSPORT', 'MEAL', 'FOOD', 'GENERIC'])
  type!: string;
}

export class CreatePlanDto {
  @IsUUID()
  benefitId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  employeeAmount!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  companyAmount!: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  copayAmount?: string;

  @IsDateString()
  validFrom!: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}

export class CreateEnrollmentDto {
  @IsUUID()
  employmentContractId!: string;

  @IsUUID()
  benefitPlanId!: string;

  @IsDateString()
  validFrom!: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ChangeEnrollmentStatusDto {
  @IsIn(['SUSPENDED', 'CANCELLED'])
  status!: 'SUSPENDED' | 'CANCELLED';

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class BenefitsQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @IsOptional()
  @IsIn(['TRANSPORT', 'MEAL', 'FOOD', 'GENERIC'])
  type?: string;
}
