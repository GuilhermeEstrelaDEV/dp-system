import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateVacationPeriodDto {
  @IsUUID()
  employmentContractId!: string;

  @IsDateString()
  accrualStart!: string;

  @IsDateString()
  accrualEnd!: string;

  @IsOptional()
  @IsDateString()
  grantStart?: string;

  @IsOptional()
  @IsDateString()
  grantEnd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateVacationRequestDto {
  @IsUUID()
  employmentContractId!: string;

  @IsUUID()
  vacationPeriodId!: string;

  @IsOptional()
  @IsUUID()
  collectiveVacationId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requestReason?: string;
}

export class DecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class CreateCollectiveVacationDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateLeaveTypeDto {
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

  @IsOptional()
  @IsBoolean()
  requiresExpectedReturn?: boolean;
}

export class CreateLeaveCaseDto {
  @IsUUID()
  employmentContractId!: string;

  @IsUUID()
  leaveTypeId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ReturnLeaveDto {
  @IsDateString()
  actualReturnDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
