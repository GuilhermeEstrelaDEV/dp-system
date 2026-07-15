import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateBranchDto {
  @IsUUID() companyId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(20) taxId?: string;
  @IsOptional() @IsObject() address?: Record<string, string>;
}
export class UpdateBranchDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(20) taxId?: string;
  @IsOptional() @IsObject() address?: Record<string, string>;
}
