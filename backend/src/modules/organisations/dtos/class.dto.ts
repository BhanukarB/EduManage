import { PartialType, ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ description: 'Organisation UUID' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: 'Grade 8' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiProperty({ example: 'GR8' })
  @IsString()
  @IsNotEmpty()
  classCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class CreateClassRequestDto extends OmitType(CreateClassDto, ['orgId'] as const) {}

export class UpdateClassDto extends PartialType(OmitType(CreateClassDto, ['orgId'] as const)) {}

export class ClassDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  classCode: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  status: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
