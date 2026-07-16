import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
export class PayrollParameterQueryDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
  @IsOptional() @IsIn(['code', 'name', 'validFrom', 'createdAt']) sortBy:
    'code' | 'name' | 'validFrom' | 'createdAt' = 'code';
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection: 'asc' | 'desc' = 'asc';
}
export class CreatePayrollParameterDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsString() @IsNotEmpty() @MaxLength(100) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) category!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) version!: string;
  @IsDateString() validFrom!: string;
  @IsOptional() @IsDateString() validTo?: string;
  @ApiPropertyOptional({
    description:
      'Configuração demonstrativa; valores monetários são strings decimais, nunca float.',
  })
  @IsOptional()
  @IsObject()
  definition?: object;
  @IsOptional() @IsString() @MaxLength(500) sourceReference?: string;
}
export class UpdatePayrollParameterDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @IsOptional() @IsObject() definition?: object;
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE']) status?: string;
}
