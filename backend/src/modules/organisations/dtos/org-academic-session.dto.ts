import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrgAcademicSessionDto {
  @ApiProperty()
  @IsUUID()
  orgId: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sessionName?: string | null;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-03-31' })
  @IsDateString()
  endDate: string;
}

export class CreateOrgAcademicSessionRequestDto extends OmitType(CreateOrgAcademicSessionDto, ['orgId'] as const) {}

export class UpdateOrgAcademicSessionDto extends PartialType(
  OmitType(CreateOrgAcademicSessionDto, ['orgId'] as const),
) {}

export class OrgAcademicSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiPropertyOptional()
  sessionName?: string | null;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
