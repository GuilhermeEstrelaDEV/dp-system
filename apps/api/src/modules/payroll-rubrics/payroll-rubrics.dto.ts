import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
export class PayrollRubricQueryDto {
  @IsUUID() companyId!: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
  @IsOptional() @IsIn(['code', 'name', 'createdAt']) sortBy: 'code' | 'name' | 'createdAt' = 'code';
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection: 'asc' | 'desc' = 'asc';
}
export class CreatePayrollRubricDto {
  @ApiProperty() @IsUUID() companyId!: string;
  @ApiProperty() @IsUUID() payrollRubricCategoryId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) version!: string;
  @ApiProperty() @IsDateString() validFrom!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() calculationBase?: object;
  @ApiPropertyOptional() @IsOptional() @IsObject() incidenceConfiguration?: object;
  @ApiPropertyOptional() @IsOptional() @IsObject() configuration?: object;
}
export class UpdatePayrollRubricDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE']) status?: string;
}
