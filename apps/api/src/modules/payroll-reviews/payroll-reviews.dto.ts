import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePayrollReviewFindingDto {
  @IsIn(['INFORMATIONAL', 'BLOCKING'])
  severity!: 'INFORMATIONAL' | 'BLOCKING';

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsUUID()
  employmentContractId?: string;

  @IsOptional()
  @IsUUID()
  payrollCalculationItemId?: string;
}

export class TransitionPayrollReviewFindingDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(1000)
  reason!: string;
}

export class PayrollReviewDecisionDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(1000)
  reason?: string;
}
