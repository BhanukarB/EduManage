import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ description: 'Organisation UUID' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: 'Grade 8' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiProperty({ example: 'GR8' })
  @IsString()
  @IsNotEmpty()
  classCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class CreateClassRequestDto extends OmitType(CreateClassDto, ['orgId'] as const) {}

export class UpdateClassDto extends PartialType(OmitType(CreateClassDto, ['orgId'] as const)) {}

export class ClassDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  classCode: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TeachingClassDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  classCode: string;

  @ApiProperty({ enum: ['section', 'batch'] })
  groupType: 'section' | 'batch';

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupName: string;

  @ApiPropertyOptional({ nullable: true })
  groupCode?: string | null;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty()
  academicSessionId: string;

  @ApiProperty()
  sessionName: string;

  @ApiPropertyOptional({ nullable: true })
  startTime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  endTime?: string | null;
}
