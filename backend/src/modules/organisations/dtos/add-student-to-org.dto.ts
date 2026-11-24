import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsDateString, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddStudentToOrgDto {
  @ApiProperty({ example: 'Asha' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'K.' })
  @IsOptional()
  @IsString()
  middleName?: string | null;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'asha@example.com' })
  @IsEmail()
  emailId: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  guardianName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  guardianContact?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  address?: Record<string, unknown> | null;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsUUID()
  academicSessionId: string;

  @ApiProperty()
  @IsUUID()
  classId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  batchId?: string | null;

  @ApiProperty({ example: 'STU-2026-001' })
  @IsString()
  @IsNotEmpty()
  enrollmentNumber: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  enrollmentDate: string;
}

export class AddStudentToOrgResultDto {
  @ApiProperty({ type: Object })
  user: Record<string, unknown>;

  @ApiProperty({ type: Object })
  student: Record<string, unknown>;
}

export enum StudentGroupType {
  Sections = 'sections',
  Batches = 'batches',
}

export interface RosterGuardian {
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string | null;
}

export interface RosterStudent extends RosterGuardian {
  id: string;
  enrollmentNumber: string;
  emailId: string | null;
  guardians: RosterGuardian[];
}

export class StudentRosterQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
}

export interface StudentRosterPage {
  group: { name: string; classId: string; className: string; academicSessionId: string };
  items: RosterStudent[];
  total: number;
  page: number;
  pageSize: number;
}
