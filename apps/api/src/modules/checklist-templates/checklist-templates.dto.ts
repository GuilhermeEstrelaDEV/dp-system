import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class TemplateItemDto {
  @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsInt() @Min(1) sortOrder!: number;
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsInt() relativeDueDays?: number;
}
export class CreateChecklistTemplateDto {
  @IsUUID() companyId!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateItemDto) items!: TemplateItemDto[];
}
