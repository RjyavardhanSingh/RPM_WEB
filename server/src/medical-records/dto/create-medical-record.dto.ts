import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty({ description: 'Patient ID for this medical record' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medication?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false,type: Object})
  @IsOptional()
  @IsObject()
  attachments?: object;

  @ApiProperty({ required: false, description: 'Doctor ID who created the record' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;
}