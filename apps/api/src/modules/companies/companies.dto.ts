import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString() @IsNotEmpty() @MaxLength(160) legalName!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) tradeName!: string;
  @IsString() @IsNotEmpty() @MaxLength(20) taxId!: string;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) legalName?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) tradeName?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(20) taxId?: string;
}
