import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ListQueryDto } from '../organizational/common.dto';

export class EmployeeListQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(['legalName', 'createdAt']) declare sortBy: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsUUID() costCenterId?: string;
}

export class CreateEmployeeDto {
  @IsString() @IsNotEmpty() @MaxLength(160) legalName!: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) preferredName?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) legalName?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) preferredName?: string;
}

export const contactTypes = ['EMAIL', 'PHONE'] as const;
export type ContactType = (typeof contactTypes)[number];

export class CreateEmployeeContactDto {
  @IsIn(contactTypes) type!: ContactType;
  @IsString() @IsNotEmpty() @MaxLength(254) value!: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() isPrimary?: boolean;
}

export class UpdateEmployeeContactDto {
  @IsOptional() @IsIn(contactTypes) type?: ContactType;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(254) value?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() isPrimary?: boolean;
}

export class EmployeeIdParamDto {
  @IsUUID() employeeId!: string;
}

export function validateContactValue(type: ContactType, value: string) {
  if (type === 'EMAIL' && !/^\S+@\S+\.\S+$/.test(value)) return false;
  if (type === 'PHONE' && value.replace(/\D/g, '').length < 8) return false;
  return true;
}
