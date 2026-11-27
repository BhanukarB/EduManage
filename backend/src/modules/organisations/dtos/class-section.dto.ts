import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateClassSectionDto {
  @ApiProperty()
  @IsUUID()
  orgId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Class UUID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  sectionCode: string;

  @ApiProperty({ example: 35 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  dailyStartTime?: string | null;

  @ApiPropertyOptional({ example: '15:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  dailyEndTime?: string | null;
}

export class CreateClassSectionRequestDto extends OmitType(CreateClassSectionDto, [
  'orgId', 'branchId',
] as const) {}

export class UpdateClassSectionDto extends PartialType(OmitType(CreateClassSectionDto, [
  'orgId', 'branchId', 'classId',
] as const)) {}

export class ClassSectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  sectionCode: string;

  @ApiProperty()
  capacity: number;

  @ApiPropertyOptional()
  dailyStartTime?: string | null;

  @ApiPropertyOptional()
  dailyEndTime?: string | null;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
