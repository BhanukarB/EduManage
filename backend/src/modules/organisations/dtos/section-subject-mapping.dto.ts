import { PartialType, ApiProperty, OmitType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateSectionSubjectMappingDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsUUID() branchId: string;
  @ApiProperty() @IsUUID() academicSessionId: string;
  @ApiProperty() @IsUUID() sectionId: string;
  @ApiProperty() @IsUUID() subjectId: string;
}

export class CreateSectionSubjectMappingRequestDto extends OmitType(CreateSectionSubjectMappingDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const) {}

export class UpdateSectionSubjectMappingDto extends PartialType(OmitType(CreateSectionSubjectMappingDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const)) {}

export class SectionSubjectMappingDto {
  @ApiProperty() id: string;
  @ApiProperty() orgId: string;
  @ApiProperty() branchId: string;
  @ApiProperty() academicSessionId: string;
  @ApiProperty() sectionId: string;
  @ApiProperty() subjectId: string;
  @ApiProperty({ required: false, nullable: true }) teacherUserId?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
