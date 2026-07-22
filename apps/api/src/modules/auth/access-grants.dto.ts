import { Type } from 'class-transformer';
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
