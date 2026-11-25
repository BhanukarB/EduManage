import { PartialType, ApiProperty, OmitType } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

export class CreateClassSubjectMappingDto {
  @ApiProperty()
  @IsUUID()
  orgId: string;

  @ApiProperty()
  @IsUUID()
  academicSessionId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  sectionId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  batchId?: string | null;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
  classStartTime: string;

  @ApiProperty({ example: '10:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
  classEndTime: string;
}

export class CreateClassSubjectMappingRequestDto extends OmitType(CreateClassSubjectMappingDto, [
  'orgId', 'academicSessionId',
] as const) {}

export class UpdateClassSubjectMappingDto extends PartialType(OmitType(CreateClassSubjectMappingDto, [
  'orgId', 'academicSessionId',
] as const)) {}

export class ClassSubjectMappingDto {
  @ApiProperty() id: string;
  @ApiProperty() orgId: string;
  @ApiProperty() academicSessionId: string;
  @ApiProperty() branchId: string;
  @ApiProperty() classId: string;
  @ApiProperty({ nullable: true }) sectionId: string | null;
  @ApiProperty({ nullable: true }) batchId: string | null;
  @ApiProperty() subjectId: string;
  @ApiProperty() classStartTime: string;
  @ApiProperty() classEndTime: string;
  @ApiProperty() createdAt: Date;
}
