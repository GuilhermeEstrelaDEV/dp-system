import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export const recordStatuses = ['ACTIVE', 'INACTIVE'] as const;
export type RecordStatus = (typeof recordStatuses)[number];

export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(recordStatuses)
  status?: RecordStatus;

  @IsOptional()
  @IsIn(['name', 'code', 'createdAt'])
  sortBy = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';
}

export class CompanyListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(['legalName', 'tradeName', 'createdAt'])
  declare sortBy: string;
}

export class CompanyScopedListQueryDto extends ListQueryDto {
  @IsUUID()
  companyId!: string;
}
