import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateAdmissionDocumentDto {
  @IsString() @IsNotEmpty() @MaxLength(160) documentType!: string;
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsString() @MaxLength(1000) observation?: string;
}
export class DocumentNoteDto {
  @IsOptional() @IsString() @MaxLength(1000) observation?: string;
}
