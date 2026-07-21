import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const positiveDecimal = /^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/;
const signedDecimal = /^-?\d+(?:\.\d{1,2})?$/;

export class VariableCompensationQueryDto {
  @IsOptional() @IsUUID() employmentContractId?: string;
  @IsOptional() @IsDateString() referencePeriod?: string;
  @IsOptional() @IsString() @MaxLength(30) status?: string;
}

export class CreateVariableCompensationEventDto {
  @IsUUID() employmentContractId!: string;
  @IsDateString() referencePeriod!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) type!: string;
  @Matches(positiveDecimal) amount!: string;
  @IsOptional() @IsString() @MaxLength(500) policyReference?: string;
}

export class CreateSalaryAdvanceDto {
  @IsUUID() employmentContractId!: string;
  @IsDateString() referencePeriod!: string;
  @Matches(positiveDecimal) amount!: string;
  @IsOptional() @IsDateString() paymentDate?: string;
}

export class CreateOffCyclePaymentDto {
  @IsUUID() employmentContractId!: string;
  @IsDateString() referencePeriod!: string;
  @Matches(positiveDecimal) amount!: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}

export class CreatePayrollReconciliationDto {
  @IsUUID() payrollRunId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) type!: string;
  @Matches(signedDecimal) differenceAmount!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
