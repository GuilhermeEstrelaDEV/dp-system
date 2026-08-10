import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const capabilityPattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

class CapabilitiesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Matches(capabilityPattern, { each: true })
  capabilities!: string[];
}

export class CreateSubstitutionDto extends CapabilitiesDto {
  @IsUUID() holderUserId!: string;
  @IsUUID() substituteUserId!: string;
  @Type(() => Date) @IsDate() startsAt!: Date;
  @Type(() => Date) @IsDate() expiresAt!: Date;
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}

export class GrantEmergencyAccessDto extends CapabilitiesDto {
  @IsUUID() beneficiaryUserId!: string;
  @Type(() => Date) @IsDate() expiresAt!: Date;
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}

export class RevokeAccessDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}

export class SubstitutionMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) holderUserId!: string;
  @ApiProperty({ format: 'uuid' }) substituteUserId!: string;
  @ApiProperty({ type: [String] }) capabilities!: string[];
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) revokedAt!: string | null;
}

export class EmergencyAccessMinimalResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) beneficiaryUserId!: string;
  @ApiProperty({ type: [String] }) capabilities!: string[];
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ format: 'date-time', nullable: true }) revokedAt!: string | null;
}
