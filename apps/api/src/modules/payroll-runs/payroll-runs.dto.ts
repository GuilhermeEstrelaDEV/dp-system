import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
export class PayrollRunQueryDto {
  @IsOptional() @IsUUID() payrollPeriodId?: string;
  @IsOptional() @IsIn(['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED']) status?: string;
  @IsOptional() @Min(1) page = 1;
  @IsOptional() @Min(1) pageSize = 20;
  @IsOptional() @IsIn(['createdAt', 'sequence', 'status']) sortBy:
    'createdAt' | 'sequence' | 'status' = 'createdAt';
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection: 'asc' | 'desc' = 'desc';
}
export class CreatePayrollRunDto {
  @IsUUID() payrollPeriodId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) engineVersion!: string;
  @IsOptional() @IsString() @MaxLength(50) parameterSnapshotVersion?: string;
  @ApiPropertyOptional({ description: 'Snapshot técnico demonstrativo, sem parâmetros legais.' })
  @IsOptional()
  @IsObject()
  parameterSnapshot?: object;
  @IsOptional() @IsString() @MaxLength(1000) technicalNotes?: string;
}
export class CreatePayrollRunMessageDto {
  @IsIn(['WARNING', 'BLOCKING_ERROR']) severity!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) message!: string;
}
