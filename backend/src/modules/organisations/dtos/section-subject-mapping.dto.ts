import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const timeFormat = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class CreateSectionSubjectMappingDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsUUID() branchId: string;
  @ApiProperty() @IsUUID() academicSessionId: string;
  @ApiProperty() @IsUUID() sectionId: string;
  @ApiProperty() @IsUUID() subjectId: string;

  @ApiPropertyOptional({ example: '09:00', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(timeFormat)
  startTime?: string | null;

  @ApiPropertyOptional({ example: '10:00', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(timeFormat)
  endTime?: string | null;
}

export class CreateSectionSubjectMappingRequestDto extends OmitType(CreateSectionSubjectMappingDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const) {}

export class UpdateSectionSubjectMappingDto extends PartialType(OmitType(CreateSectionSubjectMappingDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const)) {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  teacherUserId?: string | null;
}

export class SectionSubjectDto {
  @ApiProperty() id: string;
  @ApiProperty() subjectId: string;
  @ApiProperty() orgId: string;
  @ApiProperty() subjectName: string;
  @ApiProperty() subjectCode: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty() status: number;
  @ApiPropertyOptional({ nullable: true }) teacherUserId?: string | null;
  @ApiPropertyOptional({ nullable: true }) teacherFirstName?: string | null;
  @ApiPropertyOptional({ nullable: true }) teacherLastName?: string | null;
  @ApiPropertyOptional({ nullable: true }) startTime?: string | null;
  @ApiPropertyOptional({ nullable: true }) endTime?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class SectionSubjectMappingDto {
  @ApiProperty() id: string;
  @ApiProperty() orgId: string;
  @ApiProperty() branchId: string;
  @ApiProperty() academicSessionId: string;
  @ApiProperty() sectionId: string;
  @ApiProperty() subjectId: string;
  @ApiProperty({ required: false, nullable: true }) teacherUserId?: string | null;
  @ApiPropertyOptional({ nullable: true }) startTime?: string | null;
  @ApiPropertyOptional({ nullable: true }) endTime?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
