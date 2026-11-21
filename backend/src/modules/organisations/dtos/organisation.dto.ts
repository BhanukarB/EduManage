import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOrganisationDto {
  @ApiProperty({ example: 'Northview School' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Learning for everyone' })
  @IsOptional()
  @IsString()
  tagline?: string | null;

  @ApiProperty({ description: 'Organisation type (1 = school, 2 = coaching)', example: 1 })
  @IsInt()
  type: number;

  @ApiProperty({ example: 'admin@northview.edu' })
  @IsEmail()
  emailId: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  address?: Record<string, unknown> | null;
}

export class UpdateOrganisationDto extends PartialType(CreateOrganisationDto) {}

export class OrganisationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  tagline?: string | null;

  @ApiProperty()
  type: number;

  @ApiProperty()
  emailId: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  logo?: string | null;

  @ApiPropertyOptional({ type: Object })
  address?: Record<string, unknown> | null;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrganisationAdminDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  emailId: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiProperty()
  orgId: string;
}
