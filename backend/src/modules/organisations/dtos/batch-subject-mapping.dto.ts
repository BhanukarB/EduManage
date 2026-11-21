import { PartialType, ApiProperty, OmitType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateBatchSubjectMappingDto {
  @ApiProperty() @IsUUID() orgId: string;
  @ApiProperty() @IsUUID() branchId: string;
  @ApiProperty() @IsUUID() academicSessionId: string;
  @ApiProperty() @IsUUID() batchId: string;
  @ApiProperty() @IsUUID() subjectId: string;
}

export class CreateBatchSubjectMappingRequestDto extends OmitType(CreateBatchSubjectMappingDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const) {}

export class UpdateBatchSubjectMappingDto extends PartialType(OmitType(CreateBatchSubjectMappingDto, [
  'orgId', 'branchId', 'academicSessionId',
] as const)) {}

export class BatchSubjectMappingDto {
  @ApiProperty() id: string;
  @ApiProperty() orgId: string;
  @ApiProperty() branchId: string;
  @ApiProperty() academicSessionId: string;
  @ApiProperty() batchId: string;
  @ApiProperty() subjectId: string;
  @ApiProperty({ required: false, nullable: true }) teacherUserId?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
