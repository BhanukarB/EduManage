import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddOrganisationStaffDto {
  @ApiProperty() @IsUUID()
  orgId: string;

  @ApiProperty() @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Selected branch-level role' }) @IsUUID()
  roleId: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  firstName: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  lastName: string;

  @ApiProperty() @IsEmail()
  emailId: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phoneNumber?: string | null;

  @ApiProperty() @IsString() @IsNotEmpty()
  designation: string;

  @ApiProperty() @IsDateString()
  joiningDate: string;
}

export class UpdateOrganisationStaffDto {
  @ApiProperty() @IsUUID()
  orgId: string;

  @ApiProperty() @IsUUID()
  staffId: string;

  @ApiPropertyOptional({ enum: [0, 1, 2] })
  @IsOptional() @IsInt() @Min(0) @Max(2)
  status?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  designation?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsUUID()
  branchId?: string | null;
}

export class OrganisationStaffDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() emailId: string;
  @ApiPropertyOptional() phoneNumber?: string | null;
  @ApiPropertyOptional({ nullable: true }) branchId: string | null;
  @ApiProperty() designation: string;
  @ApiProperty() status: number;
}

export class StaffPageQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  roleId?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) @Max(2147483647)
  page = 1;

  @ApiPropertyOptional({ default: 10 }) @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 10;
}

export class OrganisationStaffPageDto {
  @ApiProperty({ type: [OrganisationStaffDto] }) items: OrganisationStaffDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
}
