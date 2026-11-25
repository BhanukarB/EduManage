import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignBranchSubjectDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;
}

export class CreateSubjectDto {
  @ApiProperty()
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @ApiProperty({ example: 'MATH' })
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @ApiPropertyOptional({ example: 'Core mathematics curriculum' })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class CreateSubjectRequestDto extends OmitType(CreateSubjectDto, ['orgId'] as const) {}

export class UpdateSubjectDto extends PartialType(OmitType(CreateSubjectDto, ['orgId'] as const)) {}

export class SubjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  subjectCode: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
