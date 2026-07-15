import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateCostCenterDto {
  @IsUUID() companyId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
}
export class UpdateCostCenterDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
}
