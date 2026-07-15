import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreatePositionDto {
  @IsUUID() companyId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
export class UpdatePositionDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) code?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
