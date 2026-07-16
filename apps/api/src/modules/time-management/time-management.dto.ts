import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SchedulePeriodDto {
  @IsInt() @Min(0) weekday!: number;
  @IsInt() @Min(0) startMinute!: number;
  @IsInt() @Min(1) endMinute!: number;
  @IsOptional() @IsInt() @Min(0) breakMinutes?: number;
}
export class CreateScheduleDto {
  @IsUUID() companyId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsInt() @Min(1) weeklyMinutes!: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchedulePeriodDto)
  periods!: SchedulePeriodDto[];
}
export class AssignScheduleDto {
  @IsUUID() workScheduleId!: string;
  @IsDateString() validFrom!: string;
  @IsOptional() @IsDateString() validTo?: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
export class CreateHolidayDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsDateString() holidayDate!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsIn(['NATIONAL', 'COMPANY']) scope!: string;
}
export class CreateTimeEntryDto {
  @IsUUID() employmentContractId!: string;
  @IsDateString() occurredOn!: string;
  @IsIn(['WORKED', 'OVERTIME', 'DELAY', 'ABSENCE', 'ADJUSTMENT']) type!: string;
  @IsInt() minutes!: number;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
export class CloseBalanceDto {
  @IsUUID() companyId!: string;
  @IsDateString() referenceMonth!: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
