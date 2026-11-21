import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'Organisation UUID' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: 'North Campus' })
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @ApiProperty({ example: 'NORTH-01' })
  @IsString()
  @IsNotEmpty()
  branchCode: string;

  @ApiProperty({ description: 'Branch type (1 = school, 2 = coaching)', example: 1 })
  @IsInt()
  type: number;

  @ApiProperty({ example: 'north@northview.edu' })
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
}

export class CreateBranchRequestDto extends OmitType(CreateBranchDto, ['orgId'] as const) {}

export class UpdateBranchDto extends PartialType(OmitType(CreateBranchDto, ['orgId'] as const)) {}

export class BranchDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  branchCode: string;

  @ApiProperty()
  type: number;

  @ApiProperty()
  emailId: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional({ type: Object })
  address?: Record<string, unknown> | null;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
