import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateDepartmentDto {
  @IsUUID() companyId!: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
}
export class UpdateDepartmentDto {
  @IsOptional() @IsUUID() branchId?: string | null;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
}
