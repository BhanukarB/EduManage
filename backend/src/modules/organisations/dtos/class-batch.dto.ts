import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateClassBatchDto {
  @ApiProperty()
  @IsUUID()
  orgId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsUUID()
  academicSessionId: string;

  @ApiProperty({ description: 'Class UUID' })
  @IsUUID()
  classId: string;

  @ApiProperty({ example: 'BATCH-01' })
  @IsString()
  @IsNotEmpty()
  batchCode: string;

  @ApiPropertyOptional({ example: 'Morning batch' })
  @IsOptional()
  @IsString()
  batchName?: string | null;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  dailyStartTime?: string | null;

  @ApiPropertyOptional({ example: '10:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  dailyEndTime?: string | null;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-03-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(1)
  capacity: number;
}

export class CreateClassBatchRequestDto extends OmitType(CreateClassBatchDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const) {}

export class UpdateClassBatchDto extends PartialType(OmitType(CreateClassBatchDto, [
  'orgId', 'branchId', 'academicSessionId', 'classId',
] as const)) {}

export class ClassBatchDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  academicSessionId: string;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  batchCode: string;

  @ApiPropertyOptional()
  batchName?: string | null;

  @ApiPropertyOptional()
  dailyStartTime?: string | null;

  @ApiPropertyOptional()
  dailyEndTime?: string | null;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
