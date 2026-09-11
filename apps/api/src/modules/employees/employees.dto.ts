import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateBy,
  ValidateNested,
  type ValidationOptions,
} from 'class-validator';
import { MaritalStatus } from '@prisma/client';
import { ListQueryDto } from '../organizational/common.dto';
import {
  isValidCpf,
  isValidPhone,
  normalizeCpf,
  normalizePostalCode,
  parseEmployeeBirthDate,
} from './employee-profile.validation';

const optionalTrimmedString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const optionalUppercaseString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

function IsEmployeeCpf(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isEmployeeCpf',
      validator: { validate: (value: unknown) => typeof value === 'string' && isValidCpf(value) },
      constraints: [],
    },
    { message: 'CPF inválido', ...options },
  );
}

function IsEmployeeBirthDate(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isEmployeeBirthDate',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && parseEmployeeBirthDate(value) !== null,
      },
      constraints: [],
    },
    {
      message: 'Data de nascimento deve ser uma data real, não futura e posterior a 1900-01-01',
      ...options,
    },
  );
}

function IsEmployeePhone(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isEmployeePhone',
      validator: { validate: (value: unknown) => typeof value === 'string' && isValidPhone(value) },
      constraints: [],
    },
    { message: 'Telefone deve conter entre 8 e 15 dígitos', ...options },
  );
}

export class EmployeeAddressDto {
  @ApiPropertyOptional({ description: 'CEP normalizado com oito dígitos.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizePostalCode(value) : value,
  )
  @Matches(/^\d{8}$/u, { message: 'CEP deve conter 8 dígitos' })
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  street?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  number?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  complement?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  district?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city?: string;
  @ApiPropertyOptional({ description: 'Sigla da unidade federativa com duas letras.' })
  @IsOptional()
  @Transform(optionalUppercaseString)
  @Matches(/^[A-Z]{2}$/u, { message: 'UF deve conter duas letras' })
  state?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country?: string;
}

export class EmployeeEmergencyContactDto {
  @ApiProperty()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;
  @ApiProperty()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  relationship!: string;
  @ApiProperty()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsEmployeePhone()
  @MaxLength(30)
  phone!: string;
}

export class EmployeeListQueryDto extends ListQueryDto {
  @IsOptional() @IsIn(['legalName', 'createdAt']) override sortBy = 'legalName';
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @IsUUID() costCenterId?: string;
}

export class CreateEmployeeDto {
  @ApiProperty()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  legalName!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  preferredName?: string;
  @ApiPropertyOptional({ description: 'CPF válido; aceita máscara e persiste somente dígitos.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCpf(value) : value,
  )
  @IsEmployeeCpf()
  cpf?: string;
  @ApiPropertyOptional({ format: 'date', description: 'Data real entre 1900-01-01 e hoje.' })
  @IsOptional()
  @IsString()
  @IsEmployeeBirthDate()
  birthDate?: string;
  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nationality?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  placeOfBirth?: string;
  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmail()
  @MaxLength(254)
  personalEmail?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmployeePhone()
  @MaxLength(30)
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmployeePhone()
  @MaxLength(30)
  secondaryPhone?: string;
  @ApiPropertyOptional({ type: () => EmployeeAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeAddressDto)
  address?: EmployeeAddressDto;
  @ApiPropertyOptional({ type: () => EmployeeEmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeEmergencyContactDto)
  emergencyContact?: EmployeeEmergencyContactDto;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  legalName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  preferredName?: string;
  @ApiPropertyOptional({ description: 'CPF válido; aceita máscara e persiste somente dígitos.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeCpf(value) : value,
  )
  @IsEmployeeCpf()
  cpf?: string;
  @ApiPropertyOptional({ format: 'date', description: 'Data real entre 1900-01-01 e hoje.' })
  @IsOptional()
  @IsString()
  @IsEmployeeBirthDate()
  birthDate?: string;
  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nationality?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  placeOfBirth?: string;
  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmail()
  @MaxLength(254)
  personalEmail?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmployeePhone()
  @MaxLength(30)
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsEmployeePhone()
  @MaxLength(30)
  secondaryPhone?: string;
  @ApiPropertyOptional({ type: () => EmployeeAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeAddressDto)
  address?: EmployeeAddressDto;
  @ApiPropertyOptional({ type: () => EmployeeEmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeEmergencyContactDto)
  emergencyContact?: EmployeeEmergencyContactDto;
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
