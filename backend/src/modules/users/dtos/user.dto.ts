import { PartialType, OmitType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateUserDto {
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

  @ApiPropertyOptional({ description: 'Organisation UUID; set by the request context for org admins.' })
  @IsOptional()
  @IsUUID()
  orgId?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  address?: Record<string, unknown> | null;
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['orgId'] as const)) {}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional()
  middleName?: string | null;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  emailId: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  orgId?: string | null;

  @ApiPropertyOptional({ type: Object })
  address?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpdateOwnPhoneDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^(?:[0-9]{10}|\+[1-9][0-9]{7,14})$/, {
    message: 'Enter 10 digits or an international number beginning with +.',
  })
  phoneNumber: string;
}

export interface ProfileGuardian {
  firstName: string;
  middleName: string | null;
  lastName: string;
  relation: string;
}

export class CurrentUserDto extends UserDto {
  @ApiPropertyOptional()
  organisationName: string | null;

  @ApiPropertyOptional()
  branchName?: string | null;

  @ApiPropertyOptional()
  joiningDate: string | null;

  @ApiPropertyOptional({ type: [Object] })
  guardians?: ProfileGuardian[];
}
