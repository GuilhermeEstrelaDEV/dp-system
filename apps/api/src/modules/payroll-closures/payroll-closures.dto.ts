import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
export class PayrollClosureQueryDto {
  @IsOptional() @IsUUID() payrollPeriodId?: string;
  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
}
export class ClosePayrollPeriodDto {
  @IsUUID() payrollPeriodId!: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
export class ReopenPayrollPeriodDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}
