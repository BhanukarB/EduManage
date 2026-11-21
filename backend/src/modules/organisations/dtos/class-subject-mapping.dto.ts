import { PartialType, ApiProperty, OmitType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateClassSubjectMappingDto {
  @ApiProperty()
  @IsUUID()
  orgId: string;

  @ApiProperty()
  @IsUUID()
  academicSessionId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;
}

export class CreateClassSubjectMappingRequestDto extends OmitType(CreateClassSubjectMappingDto, [
  'orgId', 'academicSessionId',
] as const) {}

export class UpdateClassSubjectMappingDto extends PartialType(OmitType(CreateClassSubjectMappingDto, [
  'orgId', 'academicSessionId',
] as const)) {}

export class ClassSubjectMappingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  academicSessionId: string;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
