import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(200)
  password!: string;
}

export class SelectCompanyDto {
  @IsUUID()
  companyId!: string;
}

export class AuthTokenResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ enum: ['Bearer'] }) tokenType!: 'Bearer';
}

export class AuthenticatedUserMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) actorId!: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) activeCompanyId!: string | null;
  @ApiProperty({ type: [String] }) permissions!: string[];
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() displayName!: string;
}

export class AvailableCompanyMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() legalName!: string;
  @ApiPropertyOptional({ nullable: true }) tradeName!: string | null;
}

export class LogoutMinimalResponseDto {
  @ApiProperty() revoked!: boolean;
}
