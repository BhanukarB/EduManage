import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

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
